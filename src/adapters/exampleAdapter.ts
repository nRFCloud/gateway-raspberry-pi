import { BluetoothAdapter, Characteristic, Descriptor, ScanResult, Services } from '@nrfcloud/gateway-common';

export class ExampleAdapter extends BluetoothAdapter {

	startScan(
		resultCallback: (deviceScanResult: ScanResult) => void
	) {
		console.info('starting scan with params', arguments);
		//Call the bluetooth stack on the device. Pass the results through the converter and then to the resultCallback
		// bluetoothStack.doStartScan({callback: (result) => {
		// 	const device = this.convertScanResult(result);
		// 	resultCallback(device);
		// }});
	}

	stopScan() {
	}

	private convertScanResult(rawScanResult): ScanResult {
		return {
			address: rawScanResult.address,
			rssi: rawScanResult.rssi,
			name: rawScanResult.name,
			advertisementData: rawScanResult.advertisementData,
		};
	}

	disconnect(id: string): Promise<any> {
		return undefined;
	}

	connect(id: string): Promise<any> {
		return undefined;
	}

	discover(id: string): Promise<Services> {
		return undefined;
	}

	readCharacteristicValue(id: string, characteristic: Characteristic): Promise<number[]> {
		return undefined;
	}

	readDescriptorValue(id: string, descriptor: Descriptor): Promise<number[]> {
		return undefined;
	}

	writeCharacteristicValue(deviceId: string, characteristic: Characteristic): Promise<void> {
		return undefined;
	}

	writeDescriptorValue(deviceId: string, descriptor: Descriptor): Promise<void> {
		return undefined;
	}

	subscribe(deviceId: string, characteristic: Characteristic, callback): Promise<void> {
		return undefined;
	}

	unsubscribe(deviceId: string, characteristic: Characteristic): Promise<void> {
		return undefined;
	}

	getRSSI(deviceId: string): Promise<number> {
		return undefined;
	}
}
