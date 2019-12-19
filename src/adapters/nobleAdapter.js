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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var beacon_utilities_1 = require("beacon-utilities");
var gateway_common_1 = require("@nrfcloud/gateway-common");
function formatUUIDIfNecessary(uuid) {
    return uuid.toLowerCase();
}
var NobleAdapter = (function (_super) {
    __extends(NobleAdapter, _super);
    function NobleAdapter() {
        var _this = _super.call(this) || this;
        _this.peripheralEntries = {};
        _this.serviceEntries = {};
        _this.characteristicEntries = {};
        _this.descriptorEntries = {};
        _this.gatewayState = {
            discovering: false,
        };
        noble_1.default.on('stateChange', function (state) {
            _this.adapterState = state;
        });
        return _this;
    }
    NobleAdapter.prototype.startScan = function (resultCallback) {
        var _this = this;
        var listener = function (peripheral) {
            _this.peripheralEntries[peripheral.address] = peripheral;
            var device = {
                address: {
                    address: peripheral.address.toUpperCase(),
                    type: peripheral.addressType,
                },
                rssi: peripheral.rssi,
                name: peripheral.advertisement.localName,
                advertisementData: _this.convertAdvertisementData(peripheral.advertisement),
            };
            resultCallback(device);
        };
        noble_1.default.on('discover', listener);
        noble_1.default.startScanning();
    };
    NobleAdapter.prototype.stopScan = function () {
        noble_1.default.stopScanning();
        noble_1.default.removeAllListeners('discover');
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
    NobleAdapter.prototype.writeDescriptorValue = function (id, descriptor) {
        return __awaiter(this, void 0, void 0, function () {
            var desc;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getNobleDescriptor(id, descriptor)];
                    case 1:
                        desc = _a.sent();
                        return [2, new Promise(function (resolve, reject) {
                                desc.writeValue(Buffer.from(descriptor.value), function (error) {
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
    NobleAdapter.prototype.disconnect = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var peripheral;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getDeviceById(id)];
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
                    case 0: return [4, this.getDeviceById(id)];
                    case 1:
                        peripheral = _a.sent();
                        if (['connected', 'connecting'].includes(peripheral.state)) {
                            return [2];
                        }
                        peripheral.once('disconnect', function () {
                            _this.emit(gateway_common_1.AdapterEvent.DeviceDisconnected, id);
                        });
                        peripheral.once('connect', function () {
                            _this.emit(gateway_common_1.AdapterEvent.DeviceConnected, id);
                        });
                        return [2, new Promise(function (resolve, reject) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            noble_1.default.stopScanning();
                                            return [4, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                                        case 1:
                                            _a.sent();
                                            peripheral.connect(function (error) {
                                                if (error) {
                                                    reject(error);
                                                }
                                                else {
                                                    resolve();
                                                }
                                            });
                                            return [2];
                                    }
                                });
                            }); })];
                }
            });
        });
    };
    NobleAdapter.prototype.discover = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var returned, services, _i, services_1, service, characteristics, converted, _a, characteristics_1, characteristic, convertedCharacteristic, _b, descriptors, _c, descriptors_1, descriptor, convertedDescriptor, _d, err_1;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (this.gatewayState.discovering) {
                            console.log('already doing a discover');
                            return [2];
                        }
                        this.gatewayState.discovering = true;
                        return [4, this.connect(id)];
                    case 1:
                        _e.sent();
                        returned = {};
                        return [4, this.discoverAllServices(id)];
                    case 2:
                        services = _e.sent();
                        _i = 0, services_1 = services;
                        _e.label = 3;
                    case 3:
                        if (!(_i < services_1.length)) return [3, 16];
                        service = services_1[_i];
                        _e.label = 4;
                    case 4:
                        _e.trys.push([4, 14, , 15]);
                        characteristics = service.characteristics;
                        converted = this.convertService(service);
                        converted.characteristics = {};
                        _a = 0, characteristics_1 = characteristics;
                        _e.label = 5;
                    case 5:
                        if (!(_a < characteristics_1.length)) return [3, 13];
                        characteristic = characteristics_1[_a];
                        convertedCharacteristic = this.convertCharacteristic(converted, characteristic);
                        _b = convertedCharacteristic;
                        return [4, this.readCharacteristicValue(id, convertedCharacteristic)];
                    case 6:
                        _b.value = _e.sent();
                        convertedCharacteristic.descriptors = {};
                        return [4, this.discoverDescriptors(id, service.uuid, characteristic.uuid)];
                    case 7:
                        descriptors = _e.sent();
                        _c = 0, descriptors_1 = descriptors;
                        _e.label = 8;
                    case 8:
                        if (!(_c < descriptors_1.length)) return [3, 11];
                        descriptor = descriptors_1[_c];
                        convertedDescriptor = this.convertDescriptor(convertedCharacteristic, descriptor);
                        _d = convertedDescriptor;
                        return [4, this.readDescriptorValue(id, convertedDescriptor)];
                    case 9:
                        _d.value = _e.sent();
                        convertedCharacteristic.descriptors[convertedDescriptor.uuid] = convertedDescriptor;
                        _e.label = 10;
                    case 10:
                        _c++;
                        return [3, 8];
                    case 11:
                        converted.characteristics[convertedCharacteristic.uuid] = convertedCharacteristic;
                        _e.label = 12;
                    case 12:
                        _a++;
                        return [3, 5];
                    case 13:
                        returned[converted.uuid] = converted;
                        return [3, 15];
                    case 14:
                        err_1 = _e.sent();
                        console.error('Error discovering characteristics', err_1);
                        return [3, 15];
                    case 15:
                        _i++;
                        return [3, 3];
                    case 16:
                        this.gatewayState.discovering = false;
                        return [2, returned];
                }
            });
        });
    };
    NobleAdapter.prototype.subscribe = function (deviceId, characteristic, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var nobleChar;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getNobleCharacteristic(deviceId, characteristic)];
                    case 1:
                        nobleChar = _a.sent();
                        nobleChar.on('data', function (data, isNotification) {
                            if (isNotification) {
                                var result = __assign(__assign({}, characteristic), { value: data && Array.from(data) });
                                callback(result);
                            }
                        });
                        return [2, new Promise(function (resolve, reject) {
                                nobleChar.subscribe(function (error) {
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
    NobleAdapter.prototype.unsubscribe = function (deviceId, characteristic) {
        return __awaiter(this, void 0, void 0, function () {
            var nobleChar;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getNobleCharacteristic(deviceId, characteristic)];
                    case 1:
                        nobleChar = _a.sent();
                        nobleChar.removeAllListeners('data');
                        return [2, new Promise(function (resolve, reject) {
                                nobleChar.unsubscribe(function (error) {
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
    NobleAdapter.prototype.getRSSI = function (deviceId) {
        return __awaiter(this, void 0, void 0, function () {
            var peripheral;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getDeviceById(deviceId)];
                    case 1:
                        peripheral = _a.sent();
                        return [2, new Promise(function (resolve, reject) {
                                peripheral.updateRssi(function (error, rssi) {
                                    if (error) {
                                        reject(error);
                                    }
                                    else {
                                        resolve(rssi);
                                    }
                                });
                            })];
                }
            });
        });
    };
    NobleAdapter.prototype.getDeviceById = function (deviceId) {
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
                        serviceUuid = serviceUuid.toUpperCase();
                        uuid = uuid.toUpperCase();
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
                        serviceUuid = serviceUuid.toUpperCase();
                        characteristicUuid = characteristicUuid.toUpperCase();
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
    NobleAdapter.prototype.discoverAllServices = function (deviceId) {
        return __awaiter(this, void 0, void 0, function () {
            var device;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getDeviceById(deviceId)];
                    case 1:
                        device = _a.sent();
                        return [2, new Promise(function (resolve, reject) {
                                device.discoverAllServicesAndCharacteristics(function (error, services, characteristics) {
                                    if (error) {
                                        reject(error);
                                    }
                                    else {
                                        for (var _i = 0, services_2 = services; _i < services_2.length; _i++) {
                                            var service = services_2[_i];
                                            var entryKey = deviceId + "/" + service.uuid;
                                            _this.serviceEntries[entryKey] = service;
                                            for (var _a = 0, _b = service.characteristics; _a < _b.length; _a++) {
                                                var characteristic = _b[_a];
                                                var entryKey_1 = deviceId + "/" + service.uuid + "/" + characteristic.uuid;
                                                _this.characteristicEntries[entryKey_1] = characteristic;
                                            }
                                        }
                                        resolve(services);
                                    }
                                });
                            })];
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
                    case 0: return [4, this.getDeviceById(deviceId)];
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
            var service;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getServiceByUUID(deviceId, serviceUuid)];
                    case 1:
                        service = _a.sent();
                        if (service) {
                            return [2, new Promise(function (resolve, reject) {
                                    service.discoverCharacteristics(uuids.map(function (uuid) { return formatUUIDIfNecessary(uuid); }), function (error, characteristics) {
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
            var characteristic;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this.getCharacteristicByUUID(deviceId, serviceUuid, characteristicUuid)];
                    case 1:
                        characteristic = _a.sent();
                        if (characteristic) {
                            return [2, new Promise(function (resolve, reject) {
                                    characteristic.discoverDescriptors(function (error, descriptors) {
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
        var uuid = gateway_common_1.shortenUUID(service.uuid);
        return new gateway_common_1.Service(uuid);
    };
    NobleAdapter.prototype.convertCharacteristic = function (service, characteristic) {
        var uuid = gateway_common_1.shortenUUID(characteristic.uuid);
        var converted = new gateway_common_1.Characteristic(uuid);
        converted.path = service.uuid + "/" + uuid;
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
            writeWithoutResponse: props.includes('writeWithoutResponse'),
            authorizedSignedWrite: props.includes('authenticatedSignedWrites'),
            notify: props.includes('notify'),
            indicate: props.includes('indicate'),
        };
    };
    NobleAdapter.prototype.convertDescriptor = function (convertedCharacteristic, descriptor) {
        var uuid = gateway_common_1.shortenUUID(descriptor.uuid);
        var converted = new gateway_common_1.Descriptor(uuid);
        converted.path = convertedCharacteristic.path + "/" + uuid;
        converted.value = [];
        return converted;
    };
    NobleAdapter.prototype.convertAdvertisementData = function (advertisement) {
        return {
            advertiseFlag: null,
            serviceUuids: advertisement.serviceUuids,
            localName: advertisement.localName,
            txPower: advertisement.txPowerLevel,
            manufacturerData: advertisement.manufacturerData && beacon_utilities_1.parseManufacturerData(Array.from(advertisement.manufacturerData)),
            serviceData: this.getServiceData(advertisement.serviceData),
        };
    };
    NobleAdapter.prototype.getServiceData = function (serviceData) {
        var returned = {};
        for (var _i = 0, serviceData_1 = serviceData; _i < serviceData_1.length; _i++) {
            var entry = serviceData_1[_i];
            var data = entry.data;
            returned[entry.uuid] = data && Array.from(data);
        }
        return returned;
    };
    NobleAdapter.prototype.getNobleCharacteristic = function (id, characteristic) {
        return __awaiter(this, void 0, void 0, function () {
            var pathParts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        pathParts = characteristic.path.split('/');
                        return [4, this.getCharacteristicByUUID(id, pathParts[0], pathParts[1])];
                    case 1: return [2, _a.sent()];
                }
            });
        });
    };
    NobleAdapter.prototype.getNobleDescriptor = function (id, descriptor) {
        var pathParts = descriptor.path.split('/');
        return this.getDescriptorByUUID(id, pathParts[0], pathParts[1], pathParts[2]);
    };
    return NobleAdapter;
}(gateway_common_1.BluetoothAdapter));
exports.NobleAdapter = NobleAdapter;
