import { AdvertisementPacket } from 'beacon-utilities';

import { Address } from './device';

export class DeviceScanResult {
	name: string;
	rssi: number;
	time: string;
	advertisementType: string;
	deviceType: string = 'BLE';
	address: Address;
	serviceUUIDs: string[];
	advertisementData: AdvertisementPacket;
}
