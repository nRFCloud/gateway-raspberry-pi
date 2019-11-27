import { Device } from './device';

export class AdvertisementData {
	advertiseFlag: number;
	serviceUuids: string[];
	localName: string;
	txPower: number;
	manufacturerData: {[key: number]: number[]} | number[]; //the front end will correctly handle parsed data or just the byte array
	serviceData: {[key: string]: number[]};
}

export class DeviceScanResult extends Device {
	name: string;
	services: any;
	flags: any;
	scanResponse: any;
	time: Date;
	txPower: number;
	advertisementType: string;
	rssi: number;
	rssiLevel: number;
	advertisementData: AdvertisementData;
}
