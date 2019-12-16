import * as awsIot from 'aws-iot-device-sdk';
import { EventEmitter } from 'events';
import isEqual from 'lodash/isEqual';
import { isBeacon } from 'beacon-utilities';

import { AdapterEvent, BluetoothAdapter } from './bluetoothAdapter';
import { MqttFacade } from './mqttFacade';
import { Characteristic, Descriptor, Services } from './interfaces/bluetooth';
import {
	C2GEventType,
	CharacteristicOperation,
	CharacteristicWriteOperation,
	DescriptorOperation,
	DescriptorWriteOperation,
	DeviceOperation,
	Message,
	ScanOperation,
	ScanType,
} from './interfaces/c2g';
import { assumeType } from './utils';
import { DeviceScanResult } from './interfaces/scanResult';

const CLIENT_CHARACTERISTIC_CONFIGURATION = '2902';

export enum GatewayEvent {
	NameChanged = 'NAME_CHANGED',
	Deleted = 'GATEWAY_DELTED',
	DeviceRemoved = 'DEVICE_REMOVED',
	ConnectionsChanged = 'CONNECTIONS_CHANGED',
}

/*
	To use the gateway in MQTTs (non-websocket) mode, keyPath, certPath and caPath *must* be defined
	To use the gateway in WSS mode, accessKeyId, secretKey, and sessionToken *must* be defined
*/

export type GatewayConfiguration = {
	keyPath?: string; //Path to the gateway's private key
	certPath?: string; //Path to the gateway's certificate file
	caPath?: string; //Path to the CA certifiate file
	gatewayId: string; //The device ID
	host: string; //The AWS IoT host name
	stage?: string; //What stage this device is on, defaults to "prod"
	tenantId: string; //The tenant ID for the associated tenant
	bluetoothAdapter: BluetoothAdapter;
	protocol?: 'mqtts' | 'wss'; //If not set, the gateway will try to guess based on what values are set
	accessKeyId?: string; //From a valid Cognito session
	secretKey?: string; //From a valid Cognito session
	sessionToken?: string; //From a valid Cognito session
	debug?: boolean; //Passed through to the AWS IoT device object
	watchInterval?: number; //How often to perform watches (beacons and RSSIs), defaults to 60 seconds
	watchDuration?: number; //How long to look for beacons, defaults to 2 seconds
}

interface GatewayState {
	scanning: boolean;
	isTryingConnection: boolean;
}

export class Gateway extends EventEmitter {
	readonly gatewayId: string;
	readonly stage: string;
	readonly tenantId: string;
	readonly gatewayDevice: awsIot.device;
	readonly bluetoothAdapter: BluetoothAdapter;
	readonly mqttFacade: MqttFacade;
	readonly watchInterval: number;
	readonly watchDuration: number;

	private deviceConnections: {[deviceId: string]: boolean} = {};
	private deviceConnectionIntervalHolder = null;
	private lastTriedAddress: string = null;

	private discoveryCache: {[key: string]: Services} = {};

	private watchList: string[] = [];
	private watcherHolder;

	private state: GatewayState;

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

		this.gatewayId = config.gatewayId;
		this.stage = config.stage || 'prod';
		this.tenantId = config.tenantId;
		this.bluetoothAdapter = config.bluetoothAdapter;
		this.watchInterval = config.watchInterval || 60;
		this.watchDuration = config.watchDuration || 2;
		this.state = {
			isTryingConnection: false,
			scanning: false,
		};

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

		//A Gateway is just an AWS IoT device, here's where it's started and connected
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
			//To finish the connection, an empty string must be published to the shadowGet topic
			this.gatewayDevice.publish(this.shadowGetTopic, '');
		});

		this.gatewayDevice.on('message', (topic, payload) => {
			this.handleMessage(topic, payload);
		});

		this.gatewayDevice.on('error', this.handleError);

		/*
		The gateway needs to listen to three topics:
		c2g: this is the primary way that the cloud talks to the gateway (cloud2gateway). Operations are sent over this topic like "start scanning"
		shadowGet/accepted:
		shadowUpdate: Both of these deal with the device's shadow. This is how bluetooth devices are "added" to a gateway as well as beacons. They're for different things, but can be handled the same
		 */
		this.gatewayDevice.subscribe(this.c2gTopic);
		this.gatewayDevice.subscribe(`${this.shadowGetTopic}/accepted`);
		this.gatewayDevice.subscribe(this.shadowUpdateTopic);

		this.mqttFacade = new MqttFacade(this.gatewayDevice, this.g2cTopic, this.gatewayId);

		this.watcherHolder = setInterval(async () => {
			await this.performWatches();
			this.performRSSIs();
		}, this.watchInterval * 1000);
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

	//The cloud is telling us to perform a task (operation)
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
				//This is probably not used for anything
				break;
			case C2GEventType.DeleteYourself: //User has deleted this gateway from their account
				console.log('Gateway has been deleted');
				this.emit(GatewayEvent.Deleted);
				break;
		}
	}

	//The gateway's shadow has changed, we need to react to the change
	private handleShadowMessage(message) {
		if (!message.state) {
			return;
		}

		const newState = message.state.desired || message.state;
		if (!newState) {
			return;
		}

		//state.desiredConnections is the list of bluetooth connections we should be worried about
		if (newState.desiredConnections) {
			this.updateDeviceConnections(newState.desiredConnections.map((conn) => conn.id));
		}

		//state.name is the name of the gateway
		if (newState.name) {
			this.emit(GatewayEvent.NameChanged, newState.name);
		}

		//state.beacons is a list of beacons we should watch
		if (newState.beacons) {
			this.handleBeaconState(newState.beacons);
		}
	}

	//Beacons are just a flat list of ids
	private handleBeaconState(beacons: string[]) {
		this.watchList = beacons;
	}

	//On a timer, we should report the RSSIs of the devices
	//The way to report about the devices is to send a "scan result" message with the updated information
	private async performRSSIs() {
		for (const deviceId of Object.keys(this.deviceConnections)) {
			if (!this.deviceConnections[deviceId]) {
				//Device isn't connected, don't bother trying to get the rssi
				continue;
			}

			try {
				const rssi = await this.bluetoothAdapter.getRSSI(deviceId);
				this.mqttFacade.handleScanResult({
					rssi,
					address: {
						address: deviceId,
						type: '',
					},
				} as unknown as DeviceScanResult, false);
			} catch (err) {
				//squelch. If there was an error, we don't care since this is not a critical piece of information
			}
		}
	}

	//On a timer, we should report about any beacons
	//Like RSSIs, we just send the information as a "scan result"
	private async performWatches(): Promise<void> {
		if (!this.watchList || this.watchList.length < 1) {
			return;
		}

		//Skip if we're already scanning
		if (this.state.scanning) {
			return;
		}

		this.state.scanning = true;
		//The way to track beacons is to just scan for them
		return new Promise<void>((resolve) => {
			this.bluetoothAdapter.startScan((result) => {
				if (this.watchList.includes(result.address.address)) {
					this.mqttFacade.handleScanResult(result, false);
				}
			});
			setTimeout(() => {
				this.bluetoothAdapter.stopScan();
				this.state.scanning = false;
				resolve();
			}, this.watchDuration * 1000);
		});
	}

	private handleError(error) {
		console.error('Error from MQTT', error);
	}

	//Do a "discover" operation on a device, this will do a standard bluetooth discover AS WELL AS grabs the current value for each characteristic and descriptor
	private async doDiscover(deviceAddress: string) {
		if (typeof this.discoveryCache[deviceAddress] === 'undefined') {
			this.discoveryCache[deviceAddress] = await this.bluetoothAdapter.discover(deviceAddress);
		}

		this.mqttFacade.reportDiscover(deviceAddress, this.discoveryCache[deviceAddress]);
	}

	//Do a characteristic read operation
	private async doCharacteristicRead(op: CharacteristicOperation) {
		try {
			const char = new Characteristic(op.characteristicUUID, op.serviceUUID);
			char.value = await this.bluetoothAdapter.readCharacteristicValue(op.deviceAddress, char);
			this.mqttFacade.reportCharacteristicRead(op.deviceAddress, char);
		} catch (err) {
			this.mqttFacade.reportError(err);
		}
	}

	//Do a characteristic write operation, note that we don't care about write without response
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

	//Do a descriptor read operation
	private async doDescriptorRead(op: DescriptorOperation) {
		try {
			const descriptor = new Descriptor(op.descriptorUUID, op.characteristicUUID, op.serviceUUID);
			descriptor.value = await this.bluetoothAdapter.readDescriptorValue(op.deviceAddress, descriptor);
			this.mqttFacade.reportDescriptorRead(op.deviceAddress, descriptor);
		} catch (err) {
			this.mqttFacade.reportError(err);
		}
	}

	//Do a descriptor write operation
	//intercept "subscribe" events (writing to 2902) and instead setup/tear down a subscription
	private async doDescriptorWrite(op: DescriptorWriteOperation) {

		try {
			const descriptor = new Descriptor(op.descriptorUUID, op.characteristicUUID, op.serviceUUID);
			descriptor.value = op.descriptorValue;
			if (descriptor.uuid === CLIENT_CHARACTERISTIC_CONFIGURATION) {
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

	//Filter out results that don't match the sent operation
	private shouldIncludeResult(op: ScanOperation, result: DeviceScanResult): boolean {
		if (op.scanType === ScanType.Beacon && !isBeacon(result.advertisementData)) {
			return false;
		}

		if (op.filter) {
			if (op.filter.name && result.name.indexOf(op.filter.name) < 0) {
				return false;
			}

			if (op.filter.rssi && result.rssi < op.filter.rssi) {
				return false;
			}
		}

		return true;
	}

	//Do a scanning operation
	private startScan(
		op: ScanOperation
	) {
		if (this.state.scanning) {
			return;
		}
		this.state.scanning = true;
		this.bluetoothAdapter.startScan(
			(result) => {
				if (this.shouldIncludeResult(op, result)) {
					this.mqttFacade.handleScanResult(result, false);
				}
			}
		);
		setTimeout(() => {
			this.bluetoothAdapter.stopScan();
			this.mqttFacade.handleScanResult(null, true);
			this.state.scanning = false;
		}, op.scanTimeout * 1000);
	}

	//Given the desired connections from the shadow, update our list of connections
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
			//If there was a difference, report the current connections
			this.reportConnections();
		}
	}

	//Report the current connections
	private reportConnections() {
		const statusConnections = this.getStatusConnections();
		this.mqttFacade.reportConnections(statusConnections);
		this.emit(GatewayEvent.ConnectionsChanged, statusConnections);
	}

	//Convert our list of connections to what the cloud is expecting
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

	//On an interval, try to initiate connections. This is started only when we have connections to initiate
	private startDeviceConnections() {
		if (this.deviceConnectionIntervalHolder === null) {
			this.deviceConnectionIntervalHolder = setInterval(() => this.initiateNextConnection(), 1000);
		}
	}

	//Try to initiate the next connection on the list
	//Will go through the list one at a time to connect (so it won't be stuck trying to connect to only the first one in the list)
	private async initiateNextConnection() {
		if (this.state.isTryingConnection) {
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
			this.state.isTryingConnection = true;
			await this.bluetoothAdapter.connect(nextAddressToTry);
		} catch (error) {
		} finally {
			this.lastTriedAddress = nextAddressToTry;
			this.state.isTryingConnection = false;
		}
	}

	public stopDeviceConnections() {
		clearInterval(this.deviceConnectionIntervalHolder);
		this.deviceConnectionIntervalHolder = null;
	}

	//Whenever a device is connected or dissconnected, we need to report it with two messages
	private reportConnectionUp(deviceId: string) {
		this.reportConnections();
		this.mqttFacade.reportConnectionUp(deviceId);
	}

	private reportConnectionDown(deviceId: string) {
		this.reportConnections();
		this.mqttFacade.reportConnectionDown(deviceId);
	}
}
