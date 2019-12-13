
//nRF Cloud expects uuids to be upper case with no dashes
import { Characteristic, Descriptor, Service } from './interfaces/bluetooth';
import {
	G2CCharacteristic,
	G2CCharacteristicProperties,
	G2CCharacteristics, G2CDescriptor, G2CDescriptors,
	G2CService,
	G2CServices,
} from './interfaces/g2c';

export function shortenUUID(uuid: string) {
	return uuid.replace(/-/g, '').toUpperCase();
}

//This bit of code is to assert that an object is of a type
//From https://github.com/microsoft/TypeScript/issues/10421#issuecomment-518806979
export function assumeType<T>(x: unknown): asserts x is T {
	return; // ¯\_(ツ)_/¯
}

function convertDescriptor(descriptor: Descriptor): G2CDescriptor {
	return {
		path: descriptor.path,
		uuid: descriptor.uuid,
		value: descriptor.value,
	};

}

function convertDescriptors(descriptors: Descriptor[]): G2CDescriptors {
	const retval: G2CDescriptors = {};

	for (const descriptor of descriptors) {
		retval[descriptor.uuid] = convertDescriptor(descriptor);
	}

	return retval;
}

function convertCharacteristic(characteristic: Characteristic): G2CCharacteristic {
	const properties: G2CCharacteristicProperties = {
		authorizedSignedWrite: characteristic.properties.auth_signed_wr,
		indicate: characteristic.properties.indicate,
		notify: characteristic.properties.notify,
		read: characteristic.properties.read,
		write: characteristic.properties.write,
		writeWithoutResponse: characteristic.properties.write_wo_resp,
	};

	return {
		uuid: characteristic.uuid,
		path: characteristic.path,
		value: characteristic.value,
		properties,
		descriptors: convertDescriptors(characteristic.descriptors),
	};
}

function convertCharacteristics(characteristics: Characteristic[]): G2CCharacteristics {
	let retval: G2CCharacteristics = null;

	if (characteristics && characteristics.length) {
		for (const characteristic of characteristics) {
			retval[characteristic.uuid] = convertCharacteristic(characteristic);
		}
	}
	return retval;
}

function convertService(service: Service): G2CService {

	return {
		uuid: service.uuid,
		characteristics: convertCharacteristics(service.characteristics),
	};
}

export function convertServices(services: Service[]): G2CServices {
	const retval: G2CServices = {};

	if (services && services.length) {
		for (const service of services) {
			retval[service.uuid] = convertService(service);
		}
	}
	return retval;
}
