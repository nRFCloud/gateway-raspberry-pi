import { BLEDevice, Characteristic, Descriptor, Services } from './bluetooth';

export enum EventType {
	CharacteristicValueChanged = 'device_characteristic_value_changed',
	DescriptorValueWrite = 'device_descriptor_value_write_result',
	DescriptorValueRead = 'device_descriptor_value_read_result',
	DescriptorValueChanged = 'device_descriptor_value_changed',
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

export interface DeviceEvent extends G2CEvent {
	device: BLEDevice;
}

export interface DeviceDiscoverEvent extends DeviceEvent {
	type: EventType.DeviceDiscover;
	services: Services;
}

export interface CharacteristicEvent extends DeviceEvent {
	type: EventType.CharacteristicValueRead | EventType.CharacteristicValueWrite | EventType.CharacteristicValueChanged;
	characteristic: Characteristic;
}

export interface DescriptorEvent extends DeviceEvent {
	type: EventType.DescriptorValueRead | EventType.DescriptorValueWrite | EventType.DescriptorValueChanged;
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

