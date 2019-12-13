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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var awsIot = __importStar(require("aws-iot-device-sdk"));
var events_1 = require("events");
var isEqual_1 = __importDefault(require("lodash/isEqual"));
var bluetoothAdapter_1 = require("./bluetoothAdapter");
var mqttFacade_1 = require("./mqttFacade");
var bluetooth_1 = require("./interfaces/bluetooth");
var c2g_1 = require("./interfaces/c2g");
var utils_1 = require("./utils");
var GatewayEvent;
(function (GatewayEvent) {
    GatewayEvent["NameChanged"] = "NAME_CHANGED";
    GatewayEvent["Deleted"] = "GATEWAY_DELTED";
    GatewayEvent["DeviceRemoved"] = "DEVICE_REMOVED";
    GatewayEvent["ConnectionsChanged"] = "CONNECTIONS_CHANGED";
})(GatewayEvent = exports.GatewayEvent || (exports.GatewayEvent = {}));
var Gateway = (function (_super) {
    __extends(Gateway, _super);
    function Gateway(config) {
        var _this = _super.call(this) || this;
        _this.deviceConnections = {};
        _this.deviceConnectionIntervalHolder = null;
        _this.isTryingConnection = false;
        _this.lastTriedAddress = null;
        _this.discoveryCache = {};
        console.info('got config object', config);
        _this.keyPath = config.keyPath;
        _this.certPath = config.certPath;
        _this.caPath = config.caPath;
        _this.gatewayId = config.gatewayId;
        _this.host = config.host;
        _this.stage = config.stage;
        _this.tenantId = config.tenantId;
        _this.bluetoothAdapter = config.bluetoothAdapter;
        _this.bluetoothAdapter.on(bluetoothAdapter_1.AdapterEvent.DeviceConnected, function (deviceId) {
            _this.deviceConnections[deviceId] = true;
            _this.reportConnectionUp(deviceId);
        });
        _this.bluetoothAdapter.on(bluetoothAdapter_1.AdapterEvent.DeviceDisconnected, function (deviceId) {
            if (typeof _this.deviceConnections[deviceId] !== 'undefined') {
                _this.deviceConnections[deviceId] = false;
                _this.reportConnectionDown(deviceId);
            }
        });
        _this.gatewayDevice = new awsIot.device({
            keyPath: _this.keyPath,
            certPath: _this.certPath,
            caPath: _this.caPath,
            clientId: _this.gatewayId,
            host: _this.host,
        });
        _this.gatewayDevice.on('connect', function () {
            console.log('connect');
            _this.gatewayDevice.publish(_this.shadowGetTopic, '');
        });
        _this.gatewayDevice.on('message', function (topic, payload) {
            _this.handleMessage(topic, payload);
        });
        _this.gatewayDevice.on('error', _this.handleError);
        _this.gatewayDevice.subscribe(_this.c2gTopic);
        _this.gatewayDevice.subscribe(_this.shadowGetTopic + "/accepted");
        _this.gatewayDevice.subscribe(_this.shadowUpdateTopic);
        _this.mqttFacade = new mqttFacade_1.MqttFacade(_this.gatewayDevice, _this.g2cTopic, _this.gatewayId);
        return _this;
    }
    Object.defineProperty(Gateway.prototype, "c2gTopic", {
        get: function () {
            return this.stage + "/" + this.tenantId + "/gateways/" + this.gatewayId + "/c2g";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Gateway.prototype, "g2cTopic", {
        get: function () {
            return this.stage + "/" + this.tenantId + "/gateways/" + this.gatewayId + "/g2c";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Gateway.prototype, "shadowGetTopic", {
        get: function () {
            return this.shadowTopic + "/get";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Gateway.prototype, "shadowUpdateTopic", {
        get: function () {
            return this.shadowTopic + "/update/delta";
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Gateway.prototype, "shadowTopic", {
        get: function () {
            return "$aws/things/" + this.gatewayId + "/shadow";
        },
        enumerable: true,
        configurable: true
    });
    Gateway.prototype.handleMessage = function (topic, payload) {
        var message = JSON.parse(payload);
        if (topic === this.c2gTopic) {
            this.handleC2GMessage(message);
        }
        if (topic.startsWith(this.shadowTopic)) {
            this.handleShadowMessage(message);
        }
    };
    Gateway.prototype.handleC2GMessage = function (message) {
        console.log('got g2c message', message);
        if (!message || !message.type || !message.id || message.type !== 'operation' || !message.operation || !message.operation.type) {
            throw new Error('Unknown message ' + JSON.stringify(message));
        }
        var op = message.operation;
        switch (op.type) {
            case c2g_1.C2GEventType.Scan:
                utils_1.assumeType(op);
                this.startScan(op.scanTimeout, op.scanMode, op.scanType, op.scanInterval, op.scanReporting, op.filter);
                break;
            case c2g_1.C2GEventType.PerformDiscover:
                utils_1.assumeType(op);
                if (op.deviceAddress) {
                    this.doDiscover(op.deviceAddress);
                }
                break;
            case c2g_1.C2GEventType.CharacteristicValueRead:
                utils_1.assumeType(op);
                if (op.deviceAddress && op.serviceUUID && op.characteristicUUID) {
                    this.doCharacteristicRead(op);
                }
                break;
            case c2g_1.C2GEventType.CharacteristicValueWrite:
                utils_1.assumeType(op);
                if (op.deviceAddress &&
                    op.serviceUUID &&
                    op.characteristicUUID &&
                    op.characteristicValue) {
                    this.doCharacteristicWrite(op);
                }
                break;
            case c2g_1.C2GEventType.DescriptorValueRead:
                utils_1.assumeType(op);
                if (op.deviceAddress &&
                    op.characteristicUUID &&
                    op.serviceUUID &&
                    op.descriptorUUID) {
                    this.doDescriptorRead(op);
                }
                break;
            case c2g_1.C2GEventType.DescriptoValueWrite:
                utils_1.assumeType(op);
                if (op.deviceAddress &&
                    op.characteristicUUID &&
                    op.serviceUUID &&
                    op.descriptorUUID &&
                    op.descriptorValue) {
                    this.doDescriptorWrite(op);
                }
                break;
            case c2g_1.C2GEventType.GatewayStatus:
                break;
            case c2g_1.C2GEventType.DeleteYourself:
                console.log('Gateway has been deleted');
                this.emit(GatewayEvent.Deleted);
                break;
        }
    };
    Gateway.prototype.handleShadowMessage = function (message) {
        if (!message.state) {
            return;
        }
        var newState = message.state.desired || message.state;
        if (!newState) {
            return;
        }
        if (newState.desiredConnections) {
            this.updateDeviceConnections(newState.desiredConnections.map(function (conn) { return conn.id; }));
        }
        if (newState.name) {
            this.emit(GatewayEvent.NameChanged, newState.name);
        }
        if (newState.beacons) {
        }
    };
    Gateway.prototype.handleError = function (error) {
        console.error('Error from MQTT', error);
    };
    Gateway.prototype.doDiscover = function (deviceAddress) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(typeof this.discoveryCache[deviceAddress] === 'undefined')) return [3, 2];
                        _a = this.discoveryCache;
                        _b = deviceAddress;
                        return [4, this.bluetoothAdapter.discover(deviceAddress)];
                    case 1:
                        _a[_b] = _c.sent();
                        _c.label = 2;
                    case 2:
                        this.mqttFacade.reportDiscover(deviceAddress, this.discoveryCache[deviceAddress]);
                        return [2];
                }
            });
        });
    };
    Gateway.prototype.doCharacteristicRead = function (op) {
        return __awaiter(this, void 0, void 0, function () {
            var char, _a, err_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        char = new bluetooth_1.Characteristic(op.characteristicUUID, op.serviceUUID);
                        _a = char;
                        return [4, this.bluetoothAdapter.readCharacteristicValue(op.deviceAddress, char)];
                    case 1:
                        _a.value = _b.sent();
                        this.mqttFacade.reportCharacteristicRead(op.deviceAddress, char);
                        return [3, 3];
                    case 2:
                        err_1 = _b.sent();
                        this.mqttFacade.reportError(err_1);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        });
    };
    Gateway.prototype.doCharacteristicWrite = function (op) {
        return __awaiter(this, void 0, void 0, function () {
            var char, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        char = new bluetooth_1.Characteristic(op.characteristicUUID, op.serviceUUID);
                        char.value = op.characteristicValue;
                        return [4, this.bluetoothAdapter.writeCharacteristicValue(op.deviceAddress, char)];
                    case 1:
                        _a.sent();
                        this.mqttFacade.reportCharacteristicWrite(op.deviceAddress, char);
                        return [3, 3];
                    case 2:
                        err_2 = _a.sent();
                        this.mqttFacade.reportError(err_2);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        });
    };
    Gateway.prototype.doDescriptorRead = function (op) {
        return __awaiter(this, void 0, void 0, function () {
            var descriptor, _a, err_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        descriptor = new bluetooth_1.Descriptor(op.descriptorUUID, op.characteristicUUID, op.serviceUUID);
                        _a = descriptor;
                        return [4, this.bluetoothAdapter.readDescriptorValue(op.deviceAddress, descriptor)];
                    case 1:
                        _a.value = _b.sent();
                        this.mqttFacade.reportDescriptorRead(op.deviceAddress, descriptor);
                        return [3, 3];
                    case 2:
                        err_3 = _b.sent();
                        this.mqttFacade.reportError(err_3);
                        return [3, 3];
                    case 3: return [2];
                }
            });
        });
    };
    Gateway.prototype.doDescriptorWrite = function (op) {
        return __awaiter(this, void 0, void 0, function () {
            var descriptor, characteristic, err_4;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 8, , 9]);
                        descriptor = new bluetooth_1.Descriptor(op.descriptorUUID, op.characteristicUUID, op.serviceUUID);
                        descriptor.value = op.descriptorValue;
                        if (!(descriptor.uuid === '2902')) return [3, 5];
                        characteristic = new bluetooth_1.Characteristic(op.characteristicUUID, op.serviceUUID);
                        if (!(descriptor.value.length > 0 && descriptor.value[0])) return [3, 2];
                        return [4, this.bluetoothAdapter.subscribe(op.deviceAddress, characteristic, function (characteristic) {
                                _this.mqttFacade.reportCharacteristicChanged(op.deviceAddress, characteristic);
                            })];
                    case 1:
                        _a.sent();
                        return [3, 4];
                    case 2: return [4, this.bluetoothAdapter.unsubscribe(op.deviceAddress, characteristic)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3, 7];
                    case 5: return [4, this.bluetoothAdapter.writeDescriptorValue(op.deviceAddress, descriptor)];
                    case 6:
                        _a.sent();
                        _a.label = 7;
                    case 7:
                        this.mqttFacade.reportDescriptorWrite(op.deviceAddress, descriptor);
                        return [3, 9];
                    case 8:
                        err_4 = _a.sent();
                        this.mqttFacade.reportError(err_4);
                        return [3, 9];
                    case 9: return [2];
                }
            });
        });
    };
    Gateway.prototype.startScan = function (scanTimeout, scanMode, scanType, scanInterval, scanReporting, filter) {
        var _this = this;
        if (scanTimeout === void 0) { scanTimeout = 3; }
        if (scanMode === void 0) { scanMode = 'active'; }
        if (scanType === void 0) { scanType = 0; }
        if (scanInterval === void 0) { scanInterval = 0; }
        if (scanReporting === void 0) { scanReporting = 'instant'; }
        this.bluetoothAdapter.startScan(scanTimeout, scanMode, scanType, scanInterval, scanReporting, filter, function (result, timedout) {
            if (timedout === void 0) { timedout = false; }
            return _this.mqttFacade.handleScanResult(result, timedout);
        });
    };
    Gateway.prototype.updateDeviceConnections = function (connections) {
        return __awaiter(this, void 0, void 0, function () {
            var existingConnections, deviceIds, connectionsToAdd, connectionsToRemove, _i, connectionsToRemove_1, connectionToRemove, error_1, _a, connectionsToAdd_1, connectionToAdd;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        existingConnections = __assign({}, this.deviceConnections);
                        deviceIds = Object.keys(existingConnections);
                        connectionsToAdd = connections.filter(function (id) { return deviceIds.indexOf(id) < 0; });
                        connectionsToRemove = deviceIds.filter(function (id) { return connections.indexOf(id) < 0; });
                        _i = 0, connectionsToRemove_1 = connectionsToRemove;
                        _b.label = 1;
                    case 1:
                        if (!(_i < connectionsToRemove_1.length)) return [3, 7];
                        connectionToRemove = connectionsToRemove_1[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, 5, 6]);
                        return [4, this.bluetoothAdapter.disconnect(connectionToRemove)];
                    case 3:
                        _b.sent();
                        return [3, 6];
                    case 4:
                        error_1 = _b.sent();
                        console.error('error', "Error removing connection to device " + (error_1 instanceof Object ? JSON.stringify(error_1) : error_1));
                        return [3, 6];
                    case 5:
                        if (typeof this.deviceConnections[connectionToRemove] !== 'undefined') {
                            delete this.deviceConnections[connectionToRemove];
                            this.emit(GatewayEvent.DeviceRemoved, connectionToRemove);
                        }
                        return [7];
                    case 6:
                        _i++;
                        return [3, 1];
                    case 7:
                        for (_a = 0, connectionsToAdd_1 = connectionsToAdd; _a < connectionsToAdd_1.length; _a++) {
                            connectionToAdd = connectionsToAdd_1[_a];
                            if (deviceIds.indexOf(connectionToAdd) < 0) {
                                this.deviceConnections[connectionToAdd] = false;
                            }
                        }
                        this.startDeviceConnections();
                        if (!isEqual_1.default(this.deviceConnections, existingConnections)) {
                            this.reportConnections();
                        }
                        return [2];
                }
            });
        });
    };
    Gateway.prototype.reportConnections = function () {
        var statusConnections = this.getStatusConnections();
        this.mqttFacade.reportConnections(statusConnections);
        this.emit(GatewayEvent.ConnectionsChanged, statusConnections);
    };
    Gateway.prototype.getStatusConnections = function () {
        var statusConnections = {};
        for (var _i = 0, _a = Object.keys(this.deviceConnections); _i < _a.length; _i++) {
            var connection = _a[_i];
            statusConnections[connection] = {
                id: connection,
                status: {
                    connected: this.deviceConnections[connection],
                },
            };
        }
        return statusConnections;
    };
    Gateway.prototype.startDeviceConnections = function () {
        var _this = this;
        if (this.deviceConnectionIntervalHolder === null) {
            this.deviceConnectionIntervalHolder = setInterval(function () { return _this.initiateNextConnection(); }, 1000);
        }
    };
    Gateway.prototype.initiateNextConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var connections, nextAddressToTry, indexOf, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isTryingConnection) {
                            return [2];
                        }
                        connections = Object.keys(this.deviceConnections).filter(function (deviceId) { return !_this.deviceConnections[deviceId]; });
                        if (connections.length < 1) {
                            return [2];
                        }
                        if (!this.lastTriedAddress || connections.indexOf(this.lastTriedAddress) < 0) {
                            nextAddressToTry = connections[0];
                        }
                        else {
                            indexOf = connections.indexOf(this.lastTriedAddress);
                            if (indexOf + 1 >= connections.length) {
                                nextAddressToTry = connections[0];
                            }
                            else {
                                nextAddressToTry = connections[indexOf + 1];
                            }
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        this.isTryingConnection = true;
                        return [4, this.bluetoothAdapter.connect(nextAddressToTry)];
                    case 2:
                        _a.sent();
                        return [3, 5];
                    case 3:
                        error_2 = _a.sent();
                        return [3, 5];
                    case 4:
                        this.lastTriedAddress = nextAddressToTry;
                        this.isTryingConnection = false;
                        return [7];
                    case 5: return [2];
                }
            });
        });
    };
    Gateway.prototype.stopDeviceConnections = function () {
        clearInterval(this.deviceConnectionIntervalHolder);
        this.deviceConnectionIntervalHolder = null;
    };
    Gateway.prototype.reportConnectionUp = function (deviceId) {
        this.reportConnections();
        this.mqttFacade.reportConnectionUp(deviceId);
    };
    Gateway.prototype.reportConnectionDown = function (deviceId) {
        this.reportConnections();
        this.mqttFacade.reportConnectionDown(deviceId);
    };
    return Gateway;
}(events_1.EventEmitter));
exports.Gateway = Gateway;
