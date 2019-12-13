import { Characteristic, Descriptor } from './bluetooth';

export enum EventType {
	DescriptorValueWrite= 'device_descriptor_value_write_result',
	DescriptorValueRead = 'device_descriptor_value_read_result',
	CharacteristicValueWrite = 'device_characteristic_value_write_result',
	CharacteristicValueRead = 'device_characteristic_value_read_result',
	DeviceDiscover = 'device_discover_result',
	DeviceDisconnected = 'device_disconnect',
	ScanResult = 'scan_result',
	DeviceConnected = 'device_connect_result', //I don't know why this doesn't follow the convention of the disconnected event
	Error = 'error',
}

export interface G2CEvent {
	type: EventType;
}

interface BLEAddress {
	address: string;
	type: string;
}

interface BLEDeviceConnectionStatus {
	connected: boolean;
}

export interface G2CDevice {
	id: string;
	address: BLEAddress;
	status: BLEDeviceConnectionStatus;
}

export interface DeviceEvent extends G2CEvent {
	device: G2CDevice;
}

export interface DeviceDiscoverEvent extends DeviceEvent {
	type: EventType.DeviceDiscover;
	services: G2CServices;
}

export interface CharacteristicEvent extends DeviceEvent {
	type: EventType.CharacteristicValueRead | EventType.CharacteristicValueWrite;
	characteristic: Characteristic;
}

export interface DescriptorEvent extends DeviceEvent {
	type: EventType.DescriptorValueRead | EventType.DescriptorValueWrite;
	descriptor: Descriptor;
}

export interface DeviceConnectedEvent extends DeviceEvent {
	type: EventType.DeviceConnected;
}

export interface DeviceDisconnectedEvent extends DeviceEvent {
	type: EventType.DeviceDisconnected;
}

export interface ErrorEvent extends G2CEvent {
	error: {
		description: any;
		code: number;
	};
	device?: {
		deviceAddress: string;
	};
}

export interface G2CCharacteristicProperties {
	read: boolean;
	writeWithoutResponse: boolean;
	write: boolean;
	notify: boolean;
	indicate: boolean;
	authorizedSignedWrite: boolean;
}

export interface G2CDescriptor {
	uuid: string;
	path: string;
	value: number[];
}

export interface G2CDescriptors {
	[key: string]: G2CDescriptor;
}

export interface G2CCharacteristic {
	uuid: string;
	path: string;
	value: number[];
	properties: G2CCharacteristicProperties;
	descriptors: G2CDescriptors;
}

export interface G2CCharacteristics {
	[key: string]: G2CCharacteristic;
}

export interface G2CService {
	uuid: string;
	characteristics: G2CCharacteristics;
}

export interface G2CServices {
	[key: string]: G2CService;
}
