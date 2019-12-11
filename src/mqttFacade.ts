import * as awsIot from 'aws-iot-device-sdk';
import { DeviceScanResult } from './interfaces/scanResult';
import { Service } from './interfaces/bluetooth';

enum EventType {
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
		const scanEvent = {
			type: EventType.ScanResult,
			subType: 'instant',
			devices: result ? [result] : [],
			timeout,
		};
		const g2cEvent = this.getG2CEvent(scanEvent);
		this.publish(this.g2cTopic, g2cEvent);
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
		const connectionUpEvent = {
			type: EventType.DeviceConnected,
			device: this.buildDeviceObjectForEvent(deviceId, true),
		};
		const g2cEvent = this.getG2CEvent(connectionUpEvent);
		this.publish(this.g2cTopic, g2cEvent);
	}

	reportConnectionDown(deviceId: string) {
		const connectionUpEvent = {
			type: EventType.DeviceDisconnected,
			device: this.buildDeviceObjectForEvent(deviceId, false),
		};
		const g2cEvent = this.getG2CEvent(connectionUpEvent);
		this.publish(this.g2cTopic, g2cEvent);
	}

	reportDiscover(deviceId: string, services: Service[]) {
		const discoverEvent = {
			type: EventType.DeviceDiscover,
			device: this.buildDeviceObjectForEvent(deviceId, true),
			services,
		};
		const g2cEvent = this.getG2CEvent(discoverEvent);
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
