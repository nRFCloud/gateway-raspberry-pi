"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var scanResult_1 = require("../interfaces/scanResult");
var ExampleAdapter = (function () {
    function ExampleAdapter() {
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
    return ExampleAdapter;
}());
exports.ExampleAdapter = ExampleAdapter;
