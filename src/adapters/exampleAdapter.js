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
var gateway_common_1 = require("@nrfcloud/gateway-common");
var gateway_common_2 = require("@nrfcloud/gateway-common");
var ExampleAdapter = (function (_super) {
    __extends(ExampleAdapter, _super);
    function ExampleAdapter() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    ExampleAdapter.prototype.startScan = function (resultCallback) {
        console.info('starting scan with params', arguments);
    };
    ExampleAdapter.prototype.stopScan = function () {
    };
    ExampleAdapter.prototype.convertScanResult = function (rawScanResult) {
        var device = new gateway_common_2.DeviceScanResult();
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
    ExampleAdapter.prototype.subscribe = function (deviceId, characteristic, callback) {
        return undefined;
    };
    ExampleAdapter.prototype.unsubscribe = function (deviceId, characteristic) {
        return undefined;
    };
    ExampleAdapter.prototype.getRSSI = function (deviceId) {
        return undefined;
    };
    return ExampleAdapter;
}(gateway_common_1.BluetoothAdapter));
exports.ExampleAdapter = ExampleAdapter;
