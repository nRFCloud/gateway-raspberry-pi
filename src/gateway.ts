import * as awsIot from "aws-iot-device-sdk";

export type GatewayConfiguration = {
	keyPath?: string;
	certPath?: string;
	caPath?: string;
	gatewayId?: string;
	host?: string;
	stage?: string;
	tenantId?: string;
}

export class Gateway {
	keyPath: string;
	certPath: string;
	caPath: string;
	gatewayId: string;
	host: string;
	stage: string;
	tenantId: string;
	gatewayDevice: any;

	get c2gTopic(): string {
		return `${this.stage}/${this.tenantId}/gateways/${this.gatewayId}/c2g`;
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
		console.info('got config object', config);
		this.keyPath = config.keyPath;
		this.certPath = config.certPath;
		this.caPath = config.caPath;
		this.gatewayId = config.gatewayId;
		this.host = config.host;
		this.stage = config.stage;
		this.tenantId = config.tenantId;

		this.gatewayDevice = new awsIot.device({
			keyPath: this.keyPath,
			certPath: this.certPath,
			caPath: this.caPath,
			clientId: this.gatewayId,
			host: this.host,
		});
		console.log(this.gatewayDevice);

		this.gatewayDevice.on('connect', () => {
			console.log('connect');
			this.gatewayDevice.publish(`${this.shadowGetTopic}`, '');
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
			this.handleG2CMessage(message);
		}

		if (topic.indexOf(this.shadowTopic) === 0) {
			this.handleShadowMessage(message);
		}
	}

	private handleG2CMessage(message) {
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
				break;
		}
	}

	private handleShadowMessage(message) {
		console.log('got shadow message', message);
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
	private startScan(scanTimeout, scanMode, scanType, scanInterval, scanReporting, filter) {
		console.info('starting scan with params', arguments);
	}

}
