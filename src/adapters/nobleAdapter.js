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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var noble_1 = __importDefault(require("@abandonware/noble"));
var bluetoothAdapter_1 = require("../bluetoothAdapter");
var scanResult_1 = require("../interfaces/scanResult");
var bluetooth_1 = require("../interfaces/bluetooth");
var utils_1 = require("../utils");
function formatUUIDIfNecessary(uuid) {
    return uuid.replace(/-/g, '').toLowerCase();
}
var NobleAdapter = (function (_super) {
    __extends(NobleAdapter, _super);
    function NobleAdapter() {
        var _this = _super.call(this) || this;
        _this.peripheralEntries = {};
        _this.serviceEntries = {};
        _this.characteristicEntries = {};
        _this.descriptorEntries = {};
        noble_1.default.on('stateChange', function (state) {
            _this.adapterState = state;
        });
        return _this;
    }
    NobleAdapter.prototype.startScan = function (scanTimeout, scanMode, scanType, scanInterval, scanReporting, filter, resultCallback) {
        var _this = this;
        var listener = function (peripheral) {
            _this.peripheralEntries[peripheral.address] = peripheral;
            var device = new scanResult_1.DeviceScanResult();
            device.address = {
                address: peripheral.address.toUpperCase(),
                type: peripheral.addressType,
            };
            device.rssi = peripheral.rssi;
            device.name = peripheral.advertisement.localName;
            device.advertisementData = _this.convertAdvertisementData(peripheral.advertisement);
            resultCallback(device);
        };
        noble_1.default.on('discover', listener);
        noble_1.default.startScanning();
        setTimeout(function () {
            noble_1.default.stopScanning();
            noble_1.default.off('discover', listener);
            resultCallback(null, true);
        }, scanTimeout * 1000);
    };
    NobleAdapter.prototype.readCharacteristicValue = function (id, characteristic) {
        return __awaiter(this, void 0, void 0, function () {
            var charac;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getNobleCharacteristic(id, characteristic)];
                    case 1:
                        charac = _a.sent();
                        return [2, new Promise(function (resolve, reject) {
                                charac.read(function (error, data) {
                                    if (error) {
                                        reject(error);
                                    }
                                    else {
                                        resolve(data && Array.from(data));
                                    }
                                });
                            })];
                }
            });
        });
    };
    NobleAdapter.prototype.writeCharacteristicValue = function (id, characteristic) {
        return __awaiter(this, void 0, void 0, function () {
            var charac;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getNobleCharacteristic(id, characteristic)];
                    case 1:
                        charac = _a.sent();
                        return [2, new Promise(function (resolve, reject) {
                                charac.write(Buffer.from(characteristic.value), false, function (error) {
                                    if (error) {
                                        reject(error);
                                    }
                                    else {
                                        resolve();
                                    }
                                });
                            })];
                }
            });
        });
    };
    NobleAdapter.prototype.readDescriptorValue = function (id, descriptor) {
        return __awaiter(this, void 0, void 0, function () {
            var desc;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getNobleDescriptor(id, descriptor)];
                    case 1:
                        desc = _a.sent();
                        return [2, new Promise(function (resolve, reject) {
                                desc.readValue(function (error, data) {
                                    if (error) {
                                        reject(error);
                                    }
                                    else {
                                        resolve(data && Array.from(data));
                                    }
                                });
                            })];
                }
            });
        });
    };
    NobleAdapter.prototype.disconnect = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var peripheral;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getEntryForId(id)];
                    case 1:
                        peripheral = _a.sent();
                        peripheral.disconnect();
                        peripheral.removeAllListeners();
                        return [2];
                }
            });
        });
    };
    NobleAdapter.prototype.connect = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var peripheral;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getEntryForId(id)];
                    case 1:
                        peripheral = _a.sent();
                        if (['connected', 'connecting'].includes(peripheral.state)) {
                            return [2];
                        }
                        peripheral.on('disconnect', function () {
                            _this.emit(bluetoothAdapter_1.AdapterEvent.DeviceDisconnected, id);
                        });
                        peripheral.on('connect', function () {
                            _this.emit(bluetoothAdapter_1.AdapterEvent.DeviceConnected, id);
                        });
                        return [2, new Promise(function (resolve, reject) {
                                peripheral.connect(function (error) {
                                    if (error) {
                                        reject(error);
                                    }
                                    else {
                                        resolve();
                                    }
                                });
                            })];
                }
            });
        });
    };
    NobleAdapter.prototype.discover = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var returned, services, _i, services_1, service, characteristics, converted, _a, characteristics_1, characteristic, convertedCharacteristic, _b, descriptors, _c, descriptors_1, descriptor, convertedDescriptor, _d, err_1;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0: return [4, this.connect(id)];
                    case 1:
                        _e.sent();
                        returned = [];
                        return [4, this.discoverServices(id)];
                    case 2:
                        services = _e.sent();
                        _i = 0, services_1 = services;
                        _e.label = 3;
                    case 3:
                        if (!(_i < services_1.length)) return [3, 17];
                        service = services_1[_i];
                        _e.label = 4;
                    case 4:
                        _e.trys.push([4, 15, , 16]);
                        return [4, this.discoverCharacteristics(id, service.uuid)];
                    case 5:
                        characteristics = _e.sent();
                        converted = this.convertService(service);
                        converted.characteristics = [];
                        _a = 0, characteristics_1 = characteristics;
                        _e.label = 6;
                    case 6:
                        if (!(_a < characteristics_1.length)) return [3, 14];
                        characteristic = characteristics_1[_a];
                        convertedCharacteristic = this.convertCharacteristic(converted, characteristic);
                        _b = convertedCharacteristic;
                        return [4, this.readCharacteristicValue(id, convertedCharacteristic)];
                    case 7:
                        _b.value = _e.sent();
                        convertedCharacteristic.descriptors = [];
                        return [4, this.discoverDescriptors(id, service.uuid, characteristic.uuid)];
                    case 8:
                        descriptors = _e.sent();
                        _c = 0, descriptors_1 = descriptors;
                        _e.label = 9;
                    case 9:
                        if (!(_c < descriptors_1.length)) return [3, 12];
                        descriptor = descriptors_1[_c];
                        convertedDescriptor = this.convertDescriptor(convertedCharacteristic, descriptor);
                        _d = convertedDescriptor;
                        return [4, this.readDescriptorValue(id, convertedDescriptor)];
                    case 10:
                        _d.value = _e.sent();
                        convertedCharacteristic.descriptors.push(convertedDescriptor);
                        _e.label = 11;
                    case 11:
                        _c++;
                        return [3, 9];
                    case 12:
                        converted.characteristics.push(convertedCharacteristic);
                        _e.label = 13;
                    case 13:
                        _a++;
                        return [3, 6];
                    case 14:
                        returned.push(converted);
                        return [3, 16];
                    case 15:
                        err_1 = _e.sent();
                        console.error('Error discovering characteristics', err_1);
                        return [3, 16];
                    case 16:
                        _i++;
                        return [3, 3];
                    case 17: return [2, returned];
                }
            });
        });
    };
    NobleAdapter.prototype.getEntryForId = function (deviceId) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(typeof this.peripheralEntries[deviceId] === 'undefined')) return [3, 2];
                        _a = this.peripheralEntries;
                        _b = deviceId;
                        return [4, this.scanForDevice(deviceId)];
                    case 1:
                        _a[_b] = _c.sent();
                        _c.label = 2;
                    case 2: return [2, this.peripheralEntries[deviceId]];
                }
            });
        });
    };
    NobleAdapter.prototype.getServiceByUUID = function (deviceId, uuid) {
        return __awaiter(this, void 0, void 0, function () {
            var entryKey, services;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entryKey = deviceId + "/" + uuid;
                        if (!(typeof this.serviceEntries[entryKey] === 'undefined')) return [3, 2];
                        return [4, this.discoverServices(deviceId, [uuid])];
                    case 1:
                        services = _a.sent();
                        if (services.length > 0) {
                            this.serviceEntries[entryKey] = services[0];
                        }
                        _a.label = 2;
                    case 2: return [2, this.serviceEntries[entryKey]];
                }
            });
        });
    };
    NobleAdapter.prototype.getCharacteristicByUUID = function (deviceId, serviceUuid, uuid) {
        return __awaiter(this, void 0, void 0, function () {
            var entryKey, characteristics;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entryKey = deviceId + "/" + serviceUuid + "/" + uuid;
                        if (!(typeof this.characteristicEntries[entryKey] === 'undefined')) return [3, 2];
                        return [4, this.discoverCharacteristics(deviceId, serviceUuid, [uuid])];
                    case 1:
                        characteristics = _a.sent();
                        if (characteristics.length > 0) {
                            this.characteristicEntries[entryKey] = characteristics[0];
                        }
                        _a.label = 2;
                    case 2: return [2, this.characteristicEntries[entryKey]];
                }
            });
        });
    };
    NobleAdapter.prototype.getDescriptorByUUID = function (deviceId, serviceUuid, characteristicUuid, uuid) {
        return __awaiter(this, void 0, void 0, function () {
            var entryKey, descriptors, descriptor;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entryKey = deviceId + "/" + serviceUuid + "/" + characteristicUuid + "/" + uuid;
                        if (!(typeof this.descriptorEntries[entryKey] === 'undefined')) return [3, 2];
                        return [4, this.discoverDescriptors(deviceId, serviceUuid, characteristicUuid)];
                    case 1:
                        descriptors = _a.sent();
                        if (descriptors.length) {
                            descriptor = descriptors.find(function (desc) { return desc.uuid === uuid; });
                            if (descriptor) {
                                this.descriptorEntries[entryKey] = descriptor;
                            }
                        }
                        _a.label = 2;
                    case 2: return [2, this.descriptorEntries[entryKey]];
                }
            });
        });
    };
    NobleAdapter.prototype.discoverServices = function (deviceId, serviceUUIDs) {
        if (serviceUUIDs === void 0) { serviceUUIDs = []; }
        return __awaiter(this, void 0, void 0, function () {
            var device;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getEntryForId(deviceId)];
                    case 1:
                        device = _a.sent();
                        return [2, new Promise(function (resolve, reject) {
                                device.discoverServices(serviceUUIDs.map(function (uuid) { return formatUUIDIfNecessary(uuid); }), function (error, services) {
                                    if (error) {
                                        console.log('error discovering service', serviceUUIDs);
                                        reject(error);
                                    }
                                    else {
                                        resolve(services);
                                    }
                                });
                            })];
                }
            });
        });
    };
    NobleAdapter.prototype.discoverCharacteristics = function (deviceId, serviceUuid, uuids) {
        if (uuids === void 0) { uuids = []; }
        return __awaiter(this, void 0, void 0, function () {
            var services, service_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.discoverServices(deviceId, [serviceUuid])];
                    case 1:
                        services = _a.sent();
                        if (services.length > 0) {
                            service_1 = services[0];
                            return [2, new Promise(function (resolve, reject) {
                                    service_1.discoverCharacteristics(uuids.map(function (uuid) { return formatUUIDIfNecessary(uuid); }), function (error, characteristics) {
                                        if (error) {
                                            console.info('error discover char', serviceUuid, error);
                                            reject(error);
                                        }
                                        else {
                                            resolve(characteristics);
                                        }
                                    });
                                })];
                        }
                        return [2, Promise.reject("Service with UUID \"" + serviceUuid + "\" not found")];
                }
            });
        });
    };
    NobleAdapter.prototype.discoverDescriptors = function (deviceId, serviceUuid, characteristicUuid) {
        return __awaiter(this, void 0, void 0, function () {
            var characteristics, char_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.discoverCharacteristics(deviceId, serviceUuid, [characteristicUuid])];
                    case 1:
                        characteristics = _a.sent();
                        if (characteristics.length > 0) {
                            char_1 = characteristics[0];
                            return [2, new Promise(function (resolve, reject) {
                                    char_1.discoverDescriptors(function (error, descriptors) {
                                        if (error) {
                                            console.info('error discovering descriptors', serviceUuid, characteristicUuid, error);
                                            reject(error);
                                        }
                                        else {
                                            resolve(descriptors);
                                        }
                                    });
                                })];
                        }
                        return [2, Promise.reject("Characteristic with path " + serviceUuid + "/" + characteristicUuid + " not found")];
                }
            });
        });
    };
    NobleAdapter.prototype.scanForDevice = function (deviceId) {
        return new Promise(function (resolve, reject) {
            var timeoutHolder = setTimeout(function () {
                noble_1.default.stopScanning();
                clearTimeout(timeoutHolder);
                noble_1.default.off('discover', listener);
                reject("Could not find device with id " + deviceId);
            }, 10000);
            var llowered = deviceId.toLowerCase();
            var listener = function (peripheral) {
                if ((peripheral.id && peripheral.id.toLowerCase() === llowered)
                    || (peripheral.address && peripheral.address.toLowerCase() === llowered)) {
                    noble_1.default.stopScanning();
                    clearTimeout(timeoutHolder);
                    noble_1.default.off('discover', listener);
                    resolve(peripheral);
                }
            };
            noble_1.default.on('discover', listener);
            noble_1.default.startScanning();
        });
    };
    NobleAdapter.prototype.convertService = function (service) {
        var uuid = utils_1.shortenUUID(service.uuid);
        var returned = new bluetooth_1.Service(uuid);
        returned.path = uuid;
        return returned;
    };
    NobleAdapter.prototype.convertCharacteristic = function (service, characteristic) {
        var uuid = utils_1.shortenUUID(characteristic.uuid);
        var converted = new bluetooth_1.Characteristic(uuid);
        converted.path = service.path + "/" + uuid;
        converted.properties = this.convertCharacteristicProperties(characteristic);
        converted.value = [];
        return converted;
    };
    NobleAdapter.prototype.convertCharacteristicProperties = function (characteristic) {
        var props = characteristic.properties;
        return {
            broadcast: props.includes('broadcast'),
            read: props.includes('read'),
            write: props.includes('write'),
            write_wo_resp: props.includes('writeWithoutResponse'),
            auth_signed_wr: props.includes('authenticatedSignedWrites'),
            notify: props.includes('notify'),
            indicate: props.includes('indicate'),
        };
    };
    NobleAdapter.prototype.convertDescriptor = function (convertedCharacteristic, descriptor) {
        var uuid = utils_1.shortenUUID(descriptor.uuid);
        var converted = new bluetooth_1.Descriptor(uuid);
        converted.path = convertedCharacteristic.path + "/" + uuid;
        converted.value = [];
        return converted;
    };
    NobleAdapter.prototype.convertAdvertisementData = function (advertisement) {
        var data = new scanResult_1.AdvertisementData();
        data.serviceUuids = advertisement.serviceUuids;
        data.localName = advertisement.localName;
        data.txPower = advertisement.txPowerLevel;
        data.manufacturerData = advertisement.manufacturerData && Array.from(advertisement.manufacturerData);
        return data;
    };
    NobleAdapter.prototype.getNobleCharacteristic = function (id, characteristic) {
        var pathParts = characteristic.path.split('/');
        return this.getCharacteristicByUUID(id, pathParts[0], pathParts[1]);
    };
    NobleAdapter.prototype.getNobleDescriptor = function (id, descriptor) {
        var pathParts = descriptor.path.split('/');
        return this.getDescriptorByUUID(id, pathParts[0], pathParts[1], pathParts[2]);
    };
    return NobleAdapter;
}(bluetoothAdapter_1.BluetoothAdapter));
exports.NobleAdapter = NobleAdapter;
