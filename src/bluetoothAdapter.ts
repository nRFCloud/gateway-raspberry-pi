import { DeviceScanResult } from './interfaces/scanResult';

export abstract class BluetoothAdapter {

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
		resultCallback: (deviceScanResult: DeviceScanResult) => void,
	);
}
