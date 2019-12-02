import { BluetoothAdapter } from '../bluetoothAdapter';
import { DeviceScanResult } from '../interfaces/scanResult';

export class ExampleAdapter extends BluetoothAdapter {
	startScan(
		scanTimeout: number,
		scanMode: "active" | "passive",
		scanType: 0 | 1,
		scanInterval: number,
		scanReporting: "instant" | "batch",
		filter: { rssi?: number; name?: string },
		resultCallback: (deviceScanResult: DeviceScanResult) => void
	) {
		console.info('starting scan with params', arguments);
		//Call the bluetooth stack on the device. Pass the results through the converter and then to the resultCallback
		// bluetoothStack.doStartScan({callback: (result) => {
		// 	const device = this.convertScanResult(result);
		// 	resultCallback(device);
		// }});
	}

	private convertScanResult(rawScanResult): DeviceScanResult {
		const device = new DeviceScanResult();
		device.address = rawScanResult.address;
		device.rssi = rawScanResult.rssi;
		device.name = rawScanResult.name;
		device.advertisementData = rawScanResult.advertisementData;
		return device;
	}

	disconnect(id: string): Promise<any> {
		return undefined;
	}

	connect(id: string): Promise<any> {
		return undefined;
	}
}
