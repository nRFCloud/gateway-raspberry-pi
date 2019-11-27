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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var noble_1 = __importDefault(require("@abandonware/noble"));
var bluetoothAdapter_1 = require("../bluetoothAdapter");
var scanResult_1 = require("../interfaces/scanResult");
var NobleAdapter = (function (_super) {
    __extends(NobleAdapter, _super);
    function NobleAdapter() {
        var _this = _super.call(this) || this;
        noble_1.default.on('stateChange', function (state) {
            console.log('state is now', state);
        });
        return _this;
    }
    NobleAdapter.prototype.startScan = function (scanTimeout, scanMode, scanType, scanInterval, scanReporting, filter, resultCallback) {
        var _this = this;
        noble_1.default.on('discover', function (peripheral) {
            var device = new scanResult_1.DeviceScanResult();
            device.address = {
                address: peripheral.address,
                type: peripheral.addressType,
            };
            device.rssi = peripheral.rssi;
            device.name = peripheral.advertisement.localName;
            device.advertisementData = _this.convertAdvertisementData(peripheral.advertisement);
            resultCallback(device);
        });
    };
    NobleAdapter.prototype.convertAdvertisementData = function (advertisement) {
        var data = new scanResult_1.AdvertisementData();
        data.serviceUuids = advertisement.serviceUuids;
        data.localName = advertisement.localName;
        data.txPower = advertisement.txPowerLevel;
        data.manufacturerData = Array.from(advertisement.manufacturerData);
        return data;
    };
    return NobleAdapter;
}(bluetoothAdapter_1.BluetoothAdapter));
exports.NobleAdapter = NobleAdapter;
