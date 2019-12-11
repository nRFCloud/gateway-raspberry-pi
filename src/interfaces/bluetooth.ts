export class Descriptor {
	uuid: string;
	value: number[];
	handle: number;
	path: string;

	constructor(uuid: string) {
		this.uuid = uuid;
	}
}

export class CharacteristicProperties {
	broadcast: boolean;
	read: boolean;
	write_wo_resp: boolean;
	write: boolean;
	notify: boolean;
	indicate: boolean;
	auth_signed_wr: boolean;
}

export class Characteristic {
	uuid: string;
	value: number[];
	descriptors?: Descriptor[];
	declarationHandle: number;
	valueHandle: number;
	properties: CharacteristicProperties;
	path: string;

	constructor(uuid: string, serviceUuid: string = null) {
		this.uuid = uuid;

		if (serviceUuid) {
			this.path = `${serviceUuid}/${uuid}`;
		}
	}
}

export class Service {
	characteristics: Characteristic[];
	uuid: string;
	startHandle: number;
	endHandle: number;
	path: string;

	constructor(uuid: string) {
		this.uuid = uuid;
	}
}
