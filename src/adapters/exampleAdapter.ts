import { BluetoothAdapter } from '@nrfcloud/gateway-common';
import { Characteristic, Descriptor, Services } from '@nrfcloud/gateway-common';
import { DeviceScanResult } from '@nrfcloud/gateway-common';

export class ExampleAdapter extends BluetoothAdapter {

	startScan(
		resultCallback: (deviceScanResult: DeviceScanResult) => void
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
