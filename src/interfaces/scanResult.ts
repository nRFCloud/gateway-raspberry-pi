import { Address } from './device';

export class AdvertisementData {
	advertiseFlag: number;
	serviceUuids: string[];
	localName: string;
	txPower: number;
	manufacturerData: {[key: number]: number[]} | number[]; //the front end will correctly handle parsed data or just the byte array
	serviceData: {[key: string]: number[]};
}

export class DeviceScanResult {
	name: string;
	rssi: number;
	time: string;
	advertisementType: string;
	deviceType: string = 'BLE';
	address: Address;
	serviceUUIDs: string[];
	advertisementData: AdvertisementData;
}
