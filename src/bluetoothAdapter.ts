import { EventEmitter } from 'events';

import { DeviceScanResult } from './interfaces/scanResult';
import { Characteristic, Descriptor, Service, Services } from './interfaces/bluetooth';

export enum AdapterEvent {
	DeviceDisconnected = 'DEVICE_DISCONNECTED',
	DeviceConnected = 'DEVICE_CONNECTED',
}

export abstract class BluetoothAdapter extends EventEmitter {

	/**
	 * Start scanning for devices. Scan results need to be converted to match DeviceScanResult
	 * @param resultCallback Called when the scan finds a device
	 */
	abstract startScan(
		resultCallback: (deviceScanResult: DeviceScanResult) => void,
	);

	/**
	 * Stop scanning for devices
	 */
	abstract stopScan();

	/**
	 * Connect to a BLE device. The adapter is responsible for reporting connection status by emitting the appropriate events
	 * @param id Device ID to connect to
	 */
	abstract connect(id: string): Promise<any>;

	/**
	 * Disconnect (remove) device connection
	 * @param id Device ID to disconnect from
	 */
	abstract disconnect(id: string): Promise<any>;

	/**
	 * Discover and read all values of the given device
	 * @param id Device ID to discover
	 * @returns Service[] An array of services
	 */
	abstract discover(id: string): Promise<Services>;

	/**
	 * Reads a characteristic value from a device
	 * @param deviceId Device ID to read from
	 * @param characteristic Characteristic to read
	 * @returns number[] the value of the characteristic
	 */
	abstract readCharacteristicValue(deviceId: string, characteristic: Characteristic): Promise<number[]>;

	/**
	 * Reads a descriptor value from a device
	 * @param deviceId Device ID to read from
	 * @param descriptor Descriptor to read
	 * @returns number[] the value of the descriptor
	 */
	abstract readDescriptorValue(deviceId: string, descriptor: Descriptor): Promise<number[]>;

	/**
	 * Write a characteristic value to a device
	 * @param deviceId Device ID to write to
	 * @param characteristic Characteristic to write
	 */
	abstract writeCharacteristicValue(deviceId: string, characteristic: Characteristic): Promise<void>;

	/**
	 * Write a descriptor value to a device, but only if not setting notifications/indications
	 * @param deviceId Device ID to write to
	 * @param descriptor Descriptor to write
	 */
	abstract writeDescriptorValue(deviceId: string, descriptor: Descriptor): Promise<void>;

	/**
	 * Turn on notifications/indications for a characteristic
	 * @param deviceId Device ID for the Characteristic
	 * @param characteristic Characteristic to subscribe to
	 * @param callback A function to call when the characteristic changes
	 */
	abstract subscribe(deviceId: string, characteristic: Characteristic, callback: (characteristic: Characteristic) => void): Promise<void>;

	/**
	 * Turn off notifications/indications for a characteristic
	 * @param deviceId Device ID for the Characteristic
	 * @param characteristic Characteristic to unsubscribe from
	 */
	abstract unsubscribe(deviceId: string, characteristic: Characteristic): Promise<void>;

	/**
	 * Read the RSSI of a device
	 * @param deviceId Device ID to read
	 */
	abstract getRSSI(deviceId: string): Promise<number>;
}
