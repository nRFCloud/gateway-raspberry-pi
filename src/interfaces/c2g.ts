export enum C2GEventType {
	DeleteYourself = 'delete_yourself',
	GatewayStatus = 'get_gateway_status',
	DescriptoValueWrite = 'device_descriptor_value_write',
	DescriptorValueRead = 'device_descriptor_value_read',
	CharacteristicValueRead = 'device_characteristic_value_read',
	Scan = 'scan',
	PerformDiscover = 'device_discover',
	CharacteristicValueWrite = 'device_characteristic_value_write',
}

export enum ScanType {
	Regular = 0,
	Beacon = 1,
}

export enum ScanReporting {
	Instant = 'instant',
	Batch = 'batch',
}

export interface Operation {
	type: C2GEventType;
}

export interface ScanOperation extends Operation {
	scanTimeout: number;
	scanMode: 'active' | 'passive';
	scanType: ScanType;
	scanReporting: ScanReporting;
	scanInterval: number;
	filter?: {
		rssi?: number,
		name?: string,
	};
}

export interface DeviceOperation extends Operation {
	deviceAddress: string;
}

export interface CharacteristicOperation extends DeviceOperation {
	serviceUUID: string;
	characteristicUUID: string;
}

export interface CharacteristicWriteOperation extends CharacteristicOperation {
	characteristicValue: number[];
}

export interface DescriptorOperation extends CharacteristicOperation {
	descriptorUUID: string;
}

export interface DescriptorWriteOperation extends DescriptorOperation {
	descriptorValue: number[];
}

export interface Message {
	type: 'operation';
	id: string;
	operation: Operation;
}
