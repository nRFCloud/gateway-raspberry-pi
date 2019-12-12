import * as awsIot from 'aws-iot-device-sdk';
import { DeviceScanResult } from './interfaces/scanResult';
import { Characteristic, Service } from './interfaces/bluetooth';

enum EventType {
	CharacteristicValueWrite = 'device_characteristic_value_write_result',
	CharacteristicValueRead = 'device_characteristic_value_read_result',
	DeviceDiscover = 'device_discover_result',
	DeviceDisconnected = 'device_disconnect',
	ScanResult = 'scan_result',
	DeviceConnected = 'device_connect_result', //I don't know why this doesn't follow the convention of the disconnected event
}

export class MqttFacade {
	private readonly mqttClient;
	private readonly g2cTopic: string;
	private readonly gatewayId: string;
	private messageId = 0;

	constructor(mqttClient: awsIot.device, g2cTopic: string, gatewayId: string) {
		this.g2cTopic = g2cTopic;
		this.mqttClient = mqttClient;
		this.gatewayId = gatewayId;
	}

	private get shadowTopic(): string {
		return `$aws/things/${this.gatewayId}/shadow`;
	}

	handleScanResult(result: DeviceScanResult, timeout: boolean = false) {
		const event = {
			type: EventType.ScanResult,
			subType: 'instant',
			devices: result ? [result] : [],
			timeout,
		};
		this.publishG2CEvent(event);
	}

	reportConnections(statusConnections) {
		const shadowUpdate = {
			state: {
				reported: {
					statusConnections,
				},
			},
		};
		this.publish(`${this.shadowTopic}/update`, shadowUpdate);
	}

	reportConnectionUp(deviceId: string) {
		const event = {
			type: EventType.DeviceConnected,
			device: this.buildDeviceObjectForEvent(deviceId, true),
		};
		this.publishG2CEvent(event);
	}

	reportConnectionDown(deviceId: string) {
		const event = {
			type: EventType.DeviceDisconnected,
			device: this.buildDeviceObjectForEvent(deviceId, false),
		};
		this.publishG2CEvent(event);
	}

	reportDiscover(deviceId: string, services: {[key: string]: Service}) {
		const discoverEvent = {
			type: EventType.DeviceDiscover,
			device: this.buildDeviceObjectForEvent(deviceId, true),
			services,
		};
		this.publishG2CEvent(discoverEvent);
	}

	reportError(err: any, id?: string, code?: number, deviceId?: string) {
		code = typeof code !== 'undefined' ? code : -1;
		err = typeof err === 'object' && err !== null ? JSON.stringify(err) : err;
		this.publishG2CEvent({
			type: 'error',
			error: {
				description: err,
				code,
			},
			device: deviceId ? {
				deviceAddress: deviceId,
			} : undefined,
		});
	}

	reportCharacteristicRead(deviceId: string,characteristic: Characteristic) {
		const charEvent = {
			type: EventType.CharacteristicValueRead,
			characteristic,
			device: this.buildDeviceObjectForEvent(deviceId, true),
		};
		this.publishG2CEvent(charEvent);
	}


	reportCharacteristicWrite(deviceId: string, characteristic: Characteristic) {
		const event = {
			type: EventType.CharacteristicValueWrite,
			characteristic,
			device: this.buildDeviceObjectForEvent(deviceId, true),
		};
		this.publishG2CEvent(event);
	}

	private publishG2CEvent(event) {
		const g2cEvent = this.getG2CEvent(event);
		this.publish(this.g2cTopic, g2cEvent);
	}


	private getG2CEvent(event) {
		if (!event.timestamp) {
			event.timestamp = new Date().toISOString();
		}
		return {
			type: 'event',
			gatewayId: this.mqttClient.clientId,
			event,
		};
	}


	private publish(topic: string, event) {
		event.messageId = this.messageId++;
		const message = JSON.stringify(event);

		this.mqttClient.publish(topic, message);
	}

	private buildDeviceObjectForEvent(deviceId: string, connected: boolean) {
		return {
			address: {
				address: deviceId,
				type: 'randomStatic',
			},
			id: deviceId,
			status: {
				connected,
			},
		};
	}


}
