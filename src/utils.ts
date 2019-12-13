
//nRF Cloud expects uuids to be upper case with no dashes
import { Characteristic, Descriptor, Service } from './interfaces/bluetooth';

export function shortenUUID(uuid: string) {
	return uuid.replace(/-/g, '').toUpperCase();
}

//This bit of code is to assert that an object is of a type
//From https://github.com/microsoft/TypeScript/issues/10421#issuecomment-518806979
export function assumeType<T>(x: unknown): asserts x is T {
	return; // ¯\_(ツ)_/¯
}
