"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var bluetoothAdapter_1 = require("../bluetoothAdapter");
var scanResult_1 = require("../interfaces/scanResult");
var ExampleAdapter = (function (_super) {
    __extends(ExampleAdapter, _super);
    function ExampleAdapter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ExampleAdapter.prototype.startScan = function (scanTimeout, scanMode, scanType, scanInterval, scanReporting, filter, resultCallback) {
        console.info('starting scan with params', arguments);
    };
    ExampleAdapter.prototype.convertScanResult = function (rawScanResult) {
        var device = new scanResult_1.DeviceScanResult();
        device.address = rawScanResult.address;
        device.rssi = rawScanResult.rssi;
        device.name = rawScanResult.name;
        device.advertisementData = rawScanResult.advertisementData;
        return device;
    };
    ExampleAdapter.prototype.disconnect = function (id) {
        return undefined;
    };
    ExampleAdapter.prototype.connect = function (id) {
        return undefined;
    };
    ExampleAdapter.prototype.discover = function (id) {
        return undefined;
    };
    ExampleAdapter.prototype.readCharacteristicValue = function (id, characteristic) {
        return undefined;
    };
    ExampleAdapter.prototype.readDescriptorValue = function (id, descriptor) {
        return undefined;
    };
    ExampleAdapter.prototype.writeCharacteristicValue = function (deviceId, characteristic) {
        return undefined;
    };
    ExampleAdapter.prototype.writeDescriptorValue = function (deviceId, descriptor) {
        return undefined;
    };
    ExampleAdapter.prototype.subscribe = function (deviceId, characteristic) {
        return undefined;
    };
    ExampleAdapter.prototype.unsubscribe = function (deviceId, characteristic) {
        return undefined;
    };
    return ExampleAdapter;
}(bluetoothAdapter_1.BluetoothAdapter));
exports.ExampleAdapter = ExampleAdapter;
