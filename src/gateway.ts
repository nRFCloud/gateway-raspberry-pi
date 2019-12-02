import * as awsIot from 'aws-iot-device-sdk';
import { EventEmitter } from 'events';

import { BluetoothAdapter } from './bluetoothAdapter';
import { DeviceScanResult } from './interfaces/scanResult';
import { arrayDeepEquals } from './utils';

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
}

export class Gateway extends EventEmitter {
	readonly keyPath: string;
	readonly certPath: string;
	readonly caPath: string;
	readonly gatewayId: string;
	readonly host: string;
	readonly stage: string;
	readonly tenantId: string;
	readonly gatewayDevice: awsIot.device;
	readonly bluetoothAdapter: BluetoothAdapter;

	private deviceConnections: string[] = [];

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
		this.keyPath = config.keyPath;
		this.certPath = config.certPath;
		this.caPath = config.caPath;
		this.gatewayId = config.gatewayId;
		this.host = config.host;
		this.stage = config.stage;
		this.tenantId = config.tenantId;
		this.bluetoothAdapter = config.bluetoothAdapter;

		this.gatewayDevice = new awsIot.device({
			keyPath: this.keyPath,
			certPath: this.certPath,
			caPath: this.caPath,
			clientId: this.gatewayId,
			host: this.host,
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

	private handleC2GMessage(message) {
		console.log('got g2c message', message);
		if (!message || !message.type || !message.id || message.type !== 'operation' || !message.operation || !message.operation.type) {
			throw new Error('Unknown message ' + JSON.stringify(message));
		}
		const op = message.operation;
		switch (op.type) {
			case 'scan': //Do a bluetooth scan
				this.startScan(op.scanTimeout, op.scanMode, op.scanType, op.scanInterval, op.scanReporting, op.filter);
				break;
			case 'device_discover': //Do a discover AND full value read
				break;
			case 'device_characteristic_value_read': //Read a characteristic
				break;
			case 'device_characteristic_value_write': //Write value to a characteristic
				break;
			case 'device_descriptor_value_read': //Read a descriptor
				break;
			case 'device_descriptor_value_write': //Write value to a descriptor
				break;
			case 'get_gateway_status': //Get information about the gateway
				break;
			case 'delete_yourself': //User has deleted this gateway from their account
				console.log('Gateway has been deleted');
				this.emit(GatewayEvent.Deleted);
				break;
		}
	}

	private handleShadowMessage(message) {
		console.log('got shadow message', JSON.stringify(message));

		const newState = message.state && message.state.desired;
		if (!newState) {
			return;
		}

		if (newState.desiredConnections) {
			this.updateDeviceConnections(newState.desiredConnections);
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

	/**
	 *
	 * @param scanTimeout When the scan should timeout, in seconds (default 3)
	 * @param scanMode Scan mode: active or passive (default active)
	 * @param scanType Type of scan: 0 for "regular", 1 for "beacons" (default 0)
	 * @param scanInterval Ignored
	 * @param scanReporting When results should be reported: "instant" or "batch" (default instant)
	 * @param filter An object: {rssi, name}. If set, results should only be reported if they are higher then sent rssi and/or match name
	 */
	private startScan(
		scanTimeout: number = 3,
		scanMode: 'active' | 'passive' = 'active',
		scanType: 0 | 1 = 0,
		scanInterval: number = 0,
		scanReporting: 'instant' | 'batch' = 'instant',
		filter?: {rssi?: number, name?: string}
	) {
		this.bluetoothAdapter.startScan(scanTimeout, scanMode, scanType, scanInterval, scanReporting, filter, (result, timedout = false) => this.handleScanResult(result, timedout));
	}

	private handleScanResult(result: DeviceScanResult, timeout: boolean = false) {
		const scanEvent = {
			type: 'scan_result',
			subType: 'instant',
			timestamp: new Date().toISOString(),
			devices: result ? [result] : [],
			timeout,
		};
		const g2cEvent = this.getG2CEvent(scanEvent);
		this.publish(this.g2cTopic, g2cEvent);
	}

	private getG2CEvent(event) {
		return {
			type: 'event',
			gatewayId: this.gatewayId,
			event,
		};
	}

	messageId = 0;
	private publish(topic: string, event) {
		event.messageId = this.messageId++;
		const message = JSON.stringify(event);

		this.gatewayDevice.publish(topic, message);
	}

	private async updateDeviceConnections(connections) {
		const existingConnections = [...this.deviceConnections];
		const connectionsToAdd = connections.filter((id: string) => existingConnections.indexOf(id) < 0);
		const connectionsToRemove = existingConnections.filter((id: string) => connections.indexOf(id) < 0);

		for (const connectionToRemove of connectionsToRemove) {
			try {
				await this.bluetoothAdapter.disconnect(connectionToRemove);
			}
			catch (error) {
				console.error('error', `Error removing connection to device ${error instanceof Object ? JSON.stringify(error) : error}`);
			}
			finally {
				const removedIndex = this.deviceConnections.indexOf(connectionToRemove);
				if (removedIndex > -1) {
					this.deviceConnections.splice(removedIndex, 1);
					this.emit(GatewayEvent.DeviceRemoved, connectionToRemove);
				}
			}
		}

		for (const connectionToAdd of connectionsToAdd) {
			if (existingConnections.indexOf(connectionToAdd) < 0) {
				this.deviceConnections.push(connectionToAdd);
			}
		}

		for (const connection of this.deviceConnections) {
			try {
				await this.bluetoothAdapter.connect(connection);
			} catch (err) {
				console.error('Error connecting', err);
			}
		}

		if (!arrayDeepEquals(this.deviceConnections, existingConnections)) {
			this.reportConnections();
		}
	}

	private reportConnections() {
		const statusConnections = this.getStatusConnections();
		const shadowUpdate = {
			state: {
				reported: {
					statusConnections,
				},
			},
		};

		this.publish(`${this.shadowTopic}/update`, shadowUpdate);
		this.emit(GatewayEvent.ConnectionsChanged, statusConnections);
	}

	private getStatusConnections() {
		const statusConnections = {};
		for (const connection of this.deviceConnections) {
			statusConnections[connection] = {
				id: connection,
				status: {
					connected: true,
				},
			};
		}
		return statusConnections;
	}

}
