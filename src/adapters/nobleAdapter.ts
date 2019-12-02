import noble from '@abandonware/noble';
import { Advertisement, Peripheral } from 'noble';

import { AdapterEvent, BluetoothAdapter } from '../bluetoothAdapter';
import { AdvertisementData, DeviceScanResult } from '../interfaces/scanResult';
import { Address } from '../interfaces/device';

export class NobleAdapter extends BluetoothAdapter {

	private peripheralEntries = {};

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
		resultCallback: (deviceScanResult: DeviceScanResult, timedout?: boolean) => void
	) {
		const listener = (peripheral: Peripheral) => {
			this.peripheralEntries[peripheral.address] = peripheral;
			const device = new DeviceScanResult();
			device.address = {
				address: peripheral.address,
				type: peripheral.addressType,
			} as Address;
			device.rssi = peripheral.rssi;
			device.name = peripheral.advertisement.localName;
			device.advertisementData = this.convertAdvertisementData(peripheral.advertisement);
			resultCallback(device);
		};
		noble.on('discover', listener);
		noble.startScanning();
		setTimeout(() => {
			noble.stopScanning();
			noble.off('discover', listener);
			resultCallback(null, true);
		}, scanTimeout * 1000);
	}

	private convertAdvertisementData(advertisement: Advertisement): AdvertisementData {
		const data = new AdvertisementData();
		data.serviceUuids = advertisement.serviceUuids
		data.localName = advertisement.localName;
		data.txPower = advertisement.txPowerLevel;
		data.manufacturerData = advertisement.manufacturerData && Array.from(advertisement.manufacturerData);
		return data;
	}

	async disconnect(id: string): Promise<any> {
		const peripheral = await this.getEntryForId(id);
		peripheral.disconnect();
		peripheral.removeAllListeners();
	}

	async connect(id: string): Promise<any> {
		const peripheral = await this.getEntryForId(id);
		peripheral.on('disconnect', () => {
			this.emit(AdapterEvent.DeviceDisconnected, id);
		});
		peripheral.on('connect', () => {
			this.emit(AdapterEvent.DeviceConnected, id);
		});
		return new Promise<any>((resolve, reject) => {
			peripheral.connect((error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}

	private async getEntryForId(deviceId: string): Promise<Peripheral> {
		if (typeof this.peripheralEntries[deviceId] === 'undefined') {
			this.peripheralEntries[deviceId] = await this.scanForDevice(deviceId);
		}
		return this.peripheralEntries[deviceId];
	}

	private scanForDevice(deviceId: string): Promise<Peripheral> {
		return new Promise<Peripheral>((resolve, reject) => {
			const timeoutHolder = setTimeout(() => {
				noble.stopScanning();
				clearTimeout(timeoutHolder);
				noble.off('discover', listener);
				reject(`Could not find device with id ${deviceId}`);
			}, 10000);
			const listener = (peripheral: Peripheral) => {
				if (peripheral.id === deviceId || peripheral.address === deviceId) {
					noble.stopScanning();
					clearTimeout(timeoutHolder);
					noble.off('discover', listener);
					resolve(peripheral);
				}
			};
			noble.on('discover', listener);
			noble.startScanning();
		});
	}
}
