import noble from '@abandonware/noble';
import { Advertisement, Peripheral } from 'noble';

import { BluetoothAdapter } from '../bluetoothAdapter';
import { AdvertisementData, DeviceScanResult } from '../interfaces/scanResult';
import { Address } from '../interfaces/device';



export class NobleAdapter extends BluetoothAdapter {
	constructor() {
		super();

		noble.on('stateChange', (state) => {
			console.log('state is now', state);
		});
	}

	startScan(
		scanTimeout: number,
		scanMode: "active" | "passive",
		scanType: 0 | 1,
		scanInterval: number,
		scanReporting: "instant" | "batch",
		filter: { rssi?: number; name?: string },
		resultCallback: (deviceScanResult: DeviceScanResult) => void
	) {
		noble.on('discover', (peripheral: Peripheral) => {
			const device = new DeviceScanResult();
			device.address = <Address>{
				address: peripheral.address,
				type: peripheral.addressType,
			};
			device.rssi = peripheral.rssi;
			device.name = peripheral.advertisement.localName;
			device.advertisementData = this.convertAdvertisementData(peripheral.advertisement);
			resultCallback(device);
		});
	}

	private convertAdvertisementData(advertisement: Advertisement): AdvertisementData {
		const data = new AdvertisementData();
		data.serviceUuids = advertisement.serviceUuids
		data.localName = advertisement.localName;
		data.txPower = advertisement.txPowerLevel;
		data.manufacturerData = Array.from(advertisement.manufacturerData);
		return data;
	}
}
