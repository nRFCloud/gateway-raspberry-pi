import * as awsIot from 'aws-iot-device-sdk';
import { EventEmitter } from 'events';
import isEqual from 'lodash/isEqual';

import { AdapterEvent, BluetoothAdapter } from './bluetoothAdapter';
import { MqttFacade } from './mqttFacade';
import { Characteristic, Descriptor, Services } from './interfaces/bluetooth';
import {
	C2GEventType,
	CharacteristicOperation,
	CharacteristicWriteOperation,
	DescriptorOperation, DescriptorWriteOperation,
	DeviceOperation,
	Message,
	ScanOperation,
} from './interfaces/c2g';
import { assumeType } from './utils';

export enum GatewayEvent {
	NameChanged = 'NAME_CHANGED',
	Deleted = 'GATEWAY_DELTED',
	DeviceRemoved = 'DEVICE_REMOVED',
	ConnectionsChanged = 'CONNECTIONS_CHANGED',
}

export type GatewayConfiguration = {
	keyPath?: string;
	certPath?: string;
	caPath?: string;
	gatewayId?: string;
	host?: string;
	stage?: string;
	tenantId?: string;
	bluetoothAdapter: BluetoothAdapter;
	protocol?: 'mqtts' | 'wss';
	accessKeyId?: string;
	secretKey?: string;
	sessionToken?: string;
	debug?: boolean;
}

export class Gateway extends EventEmitter {
	readonly gatewayId: string;
	readonly stage: string;
	readonly tenantId: string;
	readonly gatewayDevice: awsIot.device;
	readonly bluetoothAdapter: BluetoothAdapter;
	readonly mqttFacade: MqttFacade;

	private deviceConnections = {};
	private deviceConnectionIntervalHolder = null;
	private isTryingConnection: boolean = false;
	private lastTriedAddress: string = null;

	private discoveryCache: {[key: string]: Services} = {};

	get c2gTopic(): string {
		return `${this.stage}/${this.tenantId}/gateways/${this.gatewayId}/c2g`;
	}

	get g2cTopic(): string {
		return `${this.stage}/${this.tenantId}/gateways/${this.gatewayId}/g2c`;
	}

	private get shadowGetTopic(): string {
		return `${this.shadowTopic}/get`;
	}

	private get shadowUpdateTopic(): string {
		return `${this.shadowTopic}/update/delta`;
	}

	private get shadowTopic(): string {
		return `$aws/things/${this.gatewayId}/shadow`;
	}

	constructor(config: GatewayConfiguration) {
		super();
		console.info('got config object', config);
		this.gatewayId = config.gatewayId;
		this.stage = config.stage;
		this.tenantId = config.tenantId;
		this.bluetoothAdapter = config.bluetoothAdapter;

		this.bluetoothAdapter.on(AdapterEvent.DeviceConnected, (deviceId) => {
			this.deviceConnections[deviceId] = true;
			this.reportConnectionUp(deviceId);
		});

		this.bluetoothAdapter.on(AdapterEvent.DeviceDisconnected, (deviceId) => {
			if (typeof this.deviceConnections[deviceId] !== 'undefined') {
				this.deviceConnections[deviceId] = false;
				this.reportConnectionDown(deviceId);
			}
		});

		this.gatewayDevice = new awsIot.device({
			keyPath: config.keyPath,
			certPath: config.certPath,
			caPath: config.caPath,
			clientId: this.gatewayId,
			host: config.host,
			protocol: config.protocol || (config.accessKeyId ? 'wss' : 'mqtts'), //if not set, try to guess
			accessKeyId: config.accessKeyId,
			secretKey: config.secretKey,
			sessionToken: config.sessionToken,
			debug: !!config.debug,
		});

		this.gatewayDevice.on('connect', () => {
			console.log('connect');
			this.gatewayDevice.publish(this.shadowGetTopic, '');
		});

		this.gatewayDevice.on('message', (topic, payload) => {
			this.handleMessage(topic, payload);
		});

		this.gatewayDevice.on('error', this.handleError);

		this.gatewayDevice.subscribe(this.c2gTopic);
		this.gatewayDevice.subscribe(`${this.shadowGetTopic}/accepted`);
		this.gatewayDevice.subscribe(this.shadowUpdateTopic);

		this.mqttFacade = new MqttFacade(this.gatewayDevice, this.g2cTopic, this.gatewayId);
	}

	private handleMessage(topic: string, payload) {
		const message = JSON.parse(payload);
		if (topic === this.c2gTopic) {
			this.handleC2GMessage(message);
		}

		if (topic.startsWith(this.shadowTopic)) {
			this.handleShadowMessage(message);
		}
	}


	private handleC2GMessage(message: Message) {
		console.log('got g2c message', message);
		if (!message || !message.type || !message.id || message.type !== 'operation' || !message.operation || !message.operation.type) {
			throw new Error('Unknown message ' + JSON.stringify(message));
		}
		let op = message.operation;
		switch (op.type) {
			case C2GEventType.Scan: //Do a bluetooth scan
				assumeType<ScanOperation>(op);
				this.startScan(op);
				break;
			case C2GEventType.PerformDiscover: //Do a discover AND full value read
				assumeType<DeviceOperation>(op);
				if (op.deviceAddress) {
					this.doDiscover(op.deviceAddress);
				}
				break;
			case C2GEventType.CharacteristicValueRead: //Read a characteristic
				assumeType<CharacteristicOperation>(op);
				if (op.deviceAddress && op.serviceUUID && op.characteristicUUID) {
					this.doCharacteristicRead(op);
				}
				break;
			case C2GEventType.CharacteristicValueWrite: //Write value to a characteristic
				assumeType<CharacteristicWriteOperation>(op);
				if (
					op.deviceAddress &&
					op.serviceUUID &&
					op.characteristicUUID &&
					op.characteristicValue
				) {
					this.doCharacteristicWrite(op);
				}
				break;
			case C2GEventType.DescriptorValueRead: //Read a descriptor
				assumeType<DescriptorOperation>(op);
				if (
					op.deviceAddress &&
					op.characteristicUUID &&
					op.serviceUUID &&
					op.descriptorUUID
				) {
					this.doDescriptorRead(op);
				}
				break;
			case C2GEventType.DescriptoValueWrite: //Write value to a descriptor
				assumeType<DescriptorWriteOperation>(op);
				if (
					op.deviceAddress &&
					op.characteristicUUID &&
					op.serviceUUID &&
					op.descriptorUUID &&
					op.descriptorValue
				) {
					this.doDescriptorWrite(op);
				}
				break;
			case C2GEventType.GatewayStatus: //Get information about the gateway
				break;
			case C2GEventType.DeleteYourself: //User has deleted this gateway from their account
				console.log('Gateway has been deleted');
				this.emit(GatewayEvent.Deleted);
				break;
		}
	}

	private handleShadowMessage(message) {
		if (!message.state) {
			return;
		}

		const newState = message.state.desired || message.state;
		if (!newState) {
			return;
		}

		if (newState.desiredConnections) {
			this.updateDeviceConnections(newState.desiredConnections.map((conn) => conn.id));
		}

		if (newState.name) {
			this.emit(GatewayEvent.NameChanged, newState.name);
		}

		if (newState.beacons) {
		}
	}

	private handleError(error) {
		console.error('Error from MQTT', error);
	}

	private async doDiscover(deviceAddress: string) {
		if (typeof this.discoveryCache[deviceAddress] === 'undefined') {
			this.discoveryCache[deviceAddress] = await this.bluetoothAdapter.discover(deviceAddress);
		}

		this.mqttFacade.reportDiscover(deviceAddress, this.discoveryCache[deviceAddress]);
	}

	private async doCharacteristicRead(op: CharacteristicOperation) {
		try {
			const char = new Characteristic(op.characteristicUUID, op.serviceUUID);
			char.value = await this.bluetoothAdapter.readCharacteristicValue(op.deviceAddress, char);
			this.mqttFacade.reportCharacteristicRead(op.deviceAddress, char);
		} catch (err) {
			this.mqttFacade.reportError(err);
		}
	}

	private async doCharacteristicWrite(op: CharacteristicWriteOperation) {
		try {
			const char = new Characteristic(op.characteristicUUID, op.serviceUUID);
			char.value = op.characteristicValue;
			await this.bluetoothAdapter.writeCharacteristicValue(op.deviceAddress, char);
			this.mqttFacade.reportCharacteristicWrite(op.deviceAddress, char);
			this.mqttFacade.reportCharacteristicChanged(op.deviceAddress, char);
		} catch (err) {
			this.mqttFacade.reportError(err);
		}
	}

	private async doDescriptorRead(op: DescriptorOperation) {
		try {
			const descriptor = new Descriptor(op.descriptorUUID, op.characteristicUUID, op.serviceUUID);
			descriptor.value = await this.bluetoothAdapter.readDescriptorValue(op.deviceAddress, descriptor);
			this.mqttFacade.reportDescriptorRead(op.deviceAddress, descriptor);
		} catch (err) {
			this.mqttFacade.reportError(err);
		}
	}

	//intercept "subscribe" events (writing to 2902) and instead setup/tear down a subscription
	private async doDescriptorWrite(op: DescriptorWriteOperation) {

		try {
			const descriptor = new Descriptor(op.descriptorUUID, op.characteristicUUID, op.serviceUUID);
			descriptor.value = op.descriptorValue;
			if (descriptor.uuid === '2902') {
				const characteristic = new Characteristic(op.characteristicUUID, op.serviceUUID);
				if (descriptor.value.length > 0 && descriptor.value[0]) {
					await this.bluetoothAdapter.subscribe(op.deviceAddress, characteristic, (characteristic: Characteristic) => {
						this.mqttFacade.reportCharacteristicChanged(op.deviceAddress, characteristic);
					});
				} else {
					await this.bluetoothAdapter.unsubscribe(op.deviceAddress, characteristic);
				}
			} else {
				await this.bluetoothAdapter.writeDescriptorValue(op.deviceAddress, descriptor);
			}
			this.mqttFacade.reportDescriptorChanged(op.deviceAddress, descriptor);
			this.mqttFacade.reportDescriptorWrite(op.deviceAddress, descriptor);
		} catch (err) {
			this.mqttFacade.reportError(err);
		}
	}

	private startScan(
		op: ScanOperation
	) {
		this.bluetoothAdapter.startScan(
			op.scanTimeout,
			op.scanMode,
			op.scanType,
			op.scanInterval,
			op.scanReporting,
			op.filter,
			(result, timedout = false) => this.mqttFacade.handleScanResult(result, timedout)
		);
	}

	private async updateDeviceConnections(connections: string[]) {
		const existingConnections = {...this.deviceConnections};
		const deviceIds = Object.keys(existingConnections);
		const connectionsToAdd = connections.filter((id: string) => deviceIds.indexOf(id) < 0);
		const connectionsToRemove = deviceIds.filter((id: string) => connections.indexOf(id) < 0);

		for (const connectionToRemove of connectionsToRemove) {
			try {
				await this.bluetoothAdapter.disconnect(connectionToRemove);
			}
			catch (error) {
				console.error('error', `Error removing connection to device ${error instanceof Object ? JSON.stringify(error) : error}`);
			}
			finally {
				if (typeof this.deviceConnections[connectionToRemove] !== 'undefined') {
					delete this.deviceConnections[connectionToRemove];
					this.emit(GatewayEvent.DeviceRemoved, connectionToRemove);
				}
			}
		}

		for (const connectionToAdd of connectionsToAdd) {
			if (deviceIds.indexOf(connectionToAdd) < 0) {
				this.deviceConnections[connectionToAdd] = false;
			}
		}

		this.startDeviceConnections();

		if (!isEqual(this.deviceConnections, existingConnections)) {
			this.reportConnections();
		}
	}

	private reportConnections() {
		const statusConnections = this.getStatusConnections();
		this.mqttFacade.reportConnections(statusConnections);
		this.emit(GatewayEvent.ConnectionsChanged, statusConnections);
	}

	private getStatusConnections() {
		const statusConnections = {};
		for (const connection of Object.keys(this.deviceConnections)) {
			statusConnections[connection] = {
				id: connection,
				status: {
					connected: this.deviceConnections[connection],
				},
			};
		}
		return statusConnections;
	}

	private startDeviceConnections() {
		if (this.deviceConnectionIntervalHolder === null) {
			this.deviceConnectionIntervalHolder = setInterval(() => this.initiateNextConnection(), 1000);
		}
	}

	//Try to initiate the next connection on the list
	private async initiateNextConnection() {
		if (this.isTryingConnection) {
			return;
		}

		const connections = Object.keys(this.deviceConnections).filter((deviceId) => !this.deviceConnections[deviceId]);
		if (connections.length < 1) { //everything is already connected
			return;
		}

		let nextAddressToTry;
		if (!this.lastTriedAddress || connections.indexOf(this.lastTriedAddress) < 0) {
			nextAddressToTry = connections[0];
		} else {
			const indexOf = connections.indexOf(this.lastTriedAddress);
			if (indexOf + 1 >= connections.length) {
				nextAddressToTry = connections[0];
			} else {
				nextAddressToTry = connections[indexOf + 1];
			}
		}

		try {
			this.isTryingConnection = true;
			await this.bluetoothAdapter.connect(nextAddressToTry);
		} catch (error) {
		} finally {
			this.lastTriedAddress = nextAddressToTry;
			this.isTryingConnection = false;
		}
	}

	public stopDeviceConnections() {
		clearInterval(this.deviceConnectionIntervalHolder);
		this.deviceConnectionIntervalHolder = null;
	}

	private reportConnectionUp(deviceId: string) {
		this.reportConnections();
		this.mqttFacade.reportConnectionUp(deviceId);
	}

	private reportConnectionDown(deviceId: string) {
		this.reportConnections();
		this.mqttFacade.reportConnectionDown(deviceId);
	}
}
