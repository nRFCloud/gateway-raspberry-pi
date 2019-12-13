import { EventEmitter } from 'events';

import { DeviceScanResult } from './interfaces/scanResult';
import { Characteristic, Descriptor, Service, Services } from './interfaces/bluetooth';

export enum AdapterEvent {
	DeviceDisconnected = 'DEVICE_DISCONNECTED',
	DeviceConnected = 'DEVICE_CONNECTED',
}

export abstract class BluetoothAdapter extends EventEmitter {

	/**
	 *
	 * @param scanTimeout When the scan should timeout, in seconds (default 3)
	 * @param scanMode Scan mode: active or passive (default active)
	 * @param scanType Type of scan: 0 for "regular", 1 for "beacons" (default 0)
	 * @param scanInterval Ignored
	 * @param scanReporting When results should be reported: "instant" or "batch" (default instant)
	 * @param filter An object: {rssi, name}. If set, results should only be reported if they are higher then sent rssi and/or match name
	 * @param resultCallback Called when the scan finds a device
	 */
	abstract startScan(
		scanTimeout: number,
		scanMode: 'active' | 'passive',
		scanType: 0 | 1,
		scanInterval: number,
		scanReporting: 'instant' | 'batch',
		filter: {rssi?: number, name?: string},
		resultCallback: (deviceScanResult: DeviceScanResult, timedout?: boolean) => void,
	);

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

	abstract writeCharacteristicValue(deviceId: string, characteristic: Characteristic): Promise<void>;

	abstract writeDescriptorValue(deviceId: string, descriptor: Descriptor): Promise<void>;

	abstract subscribe(deviceId: string, characteristic: Characteristic): Promise<void>;

	abstract unsubscribe(deviceId: string, characteristic: Characteristic): Promise<void>;
}
