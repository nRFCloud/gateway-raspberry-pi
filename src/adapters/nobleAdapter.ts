import noble from '@abandonware/noble';
import { Advertisement, Peripheral, Service as NobleService, Characteristic as NobleCharacteristic } from 'noble';

import { AdapterEvent, BluetoothAdapter } from '../bluetoothAdapter';
import { AdvertisementData, DeviceScanResult } from '../interfaces/scanResult';
import { Address } from '../interfaces/device';
import { Characteristic, CharacteristicProperties, Service } from '../interfaces/bluetooth';
import { shortenUUID } from '../utils';

function formatUUIDIfNecessary(uuid: string): string {
	if (uuid.length === 32) {
		return uuid.replace(/([0-z]{8})([0-z]{4})([0-z]{4})([0-z]{4})([0-z]{12})/, '$1-$2-$3-$4-$5');
	}

	return uuid;
}

export class NobleAdapter extends BluetoothAdapter {

	private peripheralEntries: {[key: string]: Peripheral} = {};
	private serviceEntries: {[key: string]: NobleService} = {};
	private characteristicEntries: {[key: string]: NobleCharacteristic} = {};
	private descriptorEntries = {};
	private adapterState;

	constructor() {
		super();

		noble.on('stateChange', (state) => {
			this.adapterState = state;
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

	async readCharacteristicValue(id: string, characteristic: Characteristic): Promise<number[]> {
		const pathParts = characteristic.path.split('/');
		const charac = await this.getCharacteristicByUUID(id, pathParts[0], pathParts[1])
		return new Promise<number[]>((resolve, reject) => {
			charac.read((error, data) => {
				if (error) {
					reject(error);
				} else {
					resolve(data && Array.from(data));
				}
			});
		});
	}

	async disconnect(id: string): Promise<any> {
		const peripheral = await this.getEntryForId(id);
		peripheral.disconnect();
		peripheral.removeAllListeners();
	}

	async connect(id: string): Promise<any> {
		const peripheral = await this.getEntryForId(id);
		if (['connected', 'connecting'].includes(peripheral.state)) {
			return;
		}
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

	async discover(id: string): Promise<Service[]> {
		await this.connect(id);
		const returned = [];
		const services: NobleService[] = await this.discoverServices(id);

		for (const service of services) {

			const characteristics = await this.discoverCharacteristics(id, service.uuid);

			const converted = this.convertService(service);
			converted.characteristics = [];
			for (const characteristic of characteristics) {

				const convertedCharacteristic = this.convertCharacteristic(converted, characteristic);
				convertedCharacteristic.value = await this.readCharacteristicValue(id, convertedCharacteristic);
			}
			returned.push(converted);
		}

		return returned;
	}

	private async getEntryForId(deviceId: string): Promise<Peripheral> {
		if (typeof this.peripheralEntries[deviceId] === 'undefined') {
			this.peripheralEntries[deviceId] = await this.scanForDevice(deviceId);
		}
		return this.peripheralEntries[deviceId];
	}

	private async getServiceByUUID(deviceId: string, uuid: string): Promise<NobleService> {
		const entryKey = `${deviceId}/${uuid}`;
		if (typeof this.serviceEntries[entryKey] === 'undefined') {
			const services = await this.discoverServices(deviceId, [uuid]);
			if (services.length > 0) {
				this.serviceEntries[entryKey] = services[0];
			}
		}

		return this.serviceEntries[entryKey];
	}

	private async getCharacteristicByUUID(deviceId: string, serviceUuid: string, uuid: string): Promise<NobleCharacteristic> {
		const entryKey = `${deviceId}/${serviceUuid}/${uuid}`;
		if (typeof this.characteristicEntries[entryKey] === 'undefined') {
			const characteristics = await this.discoverCharacteristics(deviceId, serviceUuid, [uuid]);
			if (characteristics.length > 0) {
				this.characteristicEntries[entryKey] = characteristics[0];
			}
		}

		return this.characteristicEntries[entryKey];
	}

	private async discoverServices(deviceId: string, serviceUUIDs: string[] = []): Promise<NobleService[]> {
		const device = await this.getEntryForId(deviceId);
		return new Promise<NobleService[]>((resolve, reject) => {
			device.discoverServices(serviceUUIDs.map((uuid) => formatUUIDIfNecessary(uuid)), (error, services) => {
				console.log('discovered services', services);
				if (error) {
					reject(error);
				} else {
					resolve(services);
				}
			});
		});
	}

	private async discoverCharacteristics(deviceId: string, serviceUuid: string, uuids: string[] = []): Promise<NobleCharacteristic[]> {
		const services = await this.discoverServices(deviceId, [serviceUuid]);
		if (services.length > 0) {
			const service = services[0];
			return new Promise<NobleCharacteristic[]>((resolve, reject) => {
				service.discoverCharacteristics(uuids.map((uuid) => formatUUIDIfNecessary(uuid)), (error, characteristics) => {
					console.log('discovered chars', characteristics);
					if (error) {
						reject(error);
					} else {
						resolve(characteristics);
					}
				});
			});
		}

		return Promise.reject(`Service with UUID "${serviceUuid}" not found`);
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

	private convertService(service: NobleService): Service {
		const uuid = shortenUUID(service.uuid);
		const returned = new Service(uuid);
		returned.path = uuid;
		return returned;
	}

	private convertCharacteristic(service: Service, characteristic: NobleCharacteristic): Characteristic {
		const uuid = shortenUUID(characteristic.uuid);
		const converted = new Characteristic(uuid);
		converted.path = `${service.path}/${uuid}`;
		converted.properties = this.convertCharacteristicProperties(characteristic);
		converted.value = [];
		return converted;
	}

	private convertCharacteristicProperties(characteristic: NobleCharacteristic): CharacteristicProperties {
		const props = characteristic.properties;
		return {
			broadcast: props.includes('broadcast'),
			read: props.includes('read'),
			write: props.includes('write'),
			write_wo_resp: props.includes('writeWithoutResponse'),
			auth_signed_wr: props.includes('authenticatedSignedWrites'),
			notify: props.includes('notify'),
			indicate: props.includes('indicate'),
		};
	}

	private convertAdvertisementData(advertisement: Advertisement): AdvertisementData {
		const data = new AdvertisementData();
		data.serviceUuids = advertisement.serviceUuids
		data.localName = advertisement.localName;
		data.txPower = advertisement.txPowerLevel;
		data.manufacturerData = advertisement.manufacturerData && Array.from(advertisement.manufacturerData);
		return data;
	}
}
