export class Descriptor {
	uuid: string;
	path: string;
	value: number[];

	constructor(uuid: string, characteristicUuid: string = null, serviceUuid: string = null) {
		this.uuid = uuid;

		if (characteristicUuid && serviceUuid) {
			this.path = `${serviceUuid}/${characteristicUuid}/${uuid}`;
		}
	}
}

export class CharacteristicProperties {
	broadcast: boolean;
	read: boolean;
	writeWithoutResponse: boolean;
	write: boolean;
	notify: boolean;
	indicate: boolean;
	authorizedSignedWrite: boolean;
}

export interface CharacteristicDescriptors {
	[key: string]: Descriptor;
}

export class Characteristic {
	uuid: string;
	path: string;
	value: number[];
	properties: CharacteristicProperties;
	descriptors: CharacteristicDescriptors;

	constructor(uuid: string, serviceUuid: string = null) {
		this.uuid = uuid;

		if (serviceUuid) {
			this.path = `${serviceUuid}/${uuid}`;
		}
	}
}

export interface ServiceCharacteristics {
	[key: string]: Characteristic;
}

export class Service {
	uuid: string;
	characteristics: ServiceCharacteristics;

	constructor(uuid: string) {
		this.uuid = uuid;
	}
}

export interface Services {
	[key: string]: Service;
}

interface BLEAddress {
	address: string;
	type: string;
}

interface BLEDeviceConnectionStatus {
	connected: boolean;
}

export interface BLEDevice {
	id: string;
	address: BLEAddress;
	status: BLEDeviceConnectionStatus;
}
