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
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var awsIot = __importStar(require("aws-iot-device-sdk"));
var events_1 = require("events");
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
        _this.deviceConnections = [];
        _this.messageId = 0;
        console.info('got config object', config);
        _this.keyPath = config.keyPath;
        _this.certPath = config.certPath;
        _this.caPath = config.caPath;
        _this.gatewayId = config.gatewayId;
        _this.host = config.host;
        _this.stage = config.stage;
        _this.tenantId = config.tenantId;
        _this.bluetoothAdapter = config.bluetoothAdapter;
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
            case 'scan':
                this.startScan(op.scanTimeout, op.scanMode, op.scanType, op.scanInterval, op.scanReporting, op.filter);
                break;
            case 'device_discover':
                break;
            case 'device_characteristic_value_read':
                break;
            case 'device_characteristic_value_write':
                break;
            case 'device_descriptor_value_read':
                break;
            case 'device_descriptor_value_write':
                break;
            case 'get_gateway_status':
                break;
            case 'delete_yourself':
                console.log('Gateway has been deleted');
                this.emit(GatewayEvent.Deleted);
                break;
        }
    };
    Gateway.prototype.handleShadowMessage = function (message) {
        console.log('got shadow message', JSON.stringify(message));
        var newState = message.state && message.state.desired;
        if (!newState) {
            return;
        }
        if (newState.desiredConnections) {
            this.updateDeviceConnections(newState.desiredConnections);
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
    Gateway.prototype.startScan = function (scanTimeout, scanMode, scanType, scanInterval, scanReporting, filter) {
        var _this = this;
        if (scanTimeout === void 0) { scanTimeout = 3; }
        if (scanMode === void 0) { scanMode = 'active'; }
        if (scanType === void 0) { scanType = 0; }
        if (scanInterval === void 0) { scanInterval = 0; }
        if (scanReporting === void 0) { scanReporting = 'instant'; }
        this.bluetoothAdapter.startScan(scanTimeout, scanMode, scanType, scanInterval, scanReporting, filter, function (result, timedout) {
            if (timedout === void 0) { timedout = false; }
            return _this.handleScanResult(result, timedout);
        });
    };
    Gateway.prototype.handleScanResult = function (result, timeout) {
        if (timeout === void 0) { timeout = false; }
        var scanEvent = {
            type: 'scan_result',
            subType: 'instant',
            timestamp: new Date().toISOString(),
            devices: result ? [result] : [],
            timeout: timeout,
        };
        var g2cEvent = this.getG2CEvent(scanEvent);
        this.publish(this.g2cTopic, g2cEvent);
    };
    Gateway.prototype.getG2CEvent = function (event) {
        return {
            type: 'event',
            gatewayId: this.gatewayId,
            event: event,
        };
    };
    Gateway.prototype.publish = function (topic, event) {
        event.messageId = this.messageId++;
        var message = JSON.stringify(event);
        this.gatewayDevice.publish(topic, message);
    };
    Gateway.prototype.updateDeviceConnections = function (connections) {
        return __awaiter(this, void 0, void 0, function () {
            var existingConnections, connectionsToAdd, connectionsToRemove, _i, connectionsToRemove_1, connectionToRemove, error_1, removedIndex, _a, connectionsToAdd_1, connectionToAdd;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        existingConnections = __spreadArrays(this.deviceConnections);
                        connectionsToAdd = connections.filter(function (id) { return existingConnections.indexOf(id) < 0; });
                        connectionsToRemove = existingConnections.filter(function (id) { return connections.indexOf(id) < 0; });
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
                        removedIndex = this.deviceConnections.indexOf(connectionToRemove);
                        if (removedIndex > -1) {
                            this.deviceConnections.splice(removedIndex, 1);
                            this.emit(GatewayEvent.DeviceRemoved, connectionToRemove);
                        }
                        return [7];
                    case 6:
                        _i++;
                        return [3, 1];
                    case 7:
                        for (_a = 0, connectionsToAdd_1 = connectionsToAdd; _a < connectionsToAdd_1.length; _a++) {
                            connectionToAdd = connectionsToAdd_1[_a];
                            if (existingConnections.indexOf(connectionToAdd) < 0) {
                                this.deviceConnections.push(connectionToAdd);
                            }
                        }
                        if (!utils_1.arrayDeepEquals(this.deviceConnections, existingConnections)) {
                            this.reportConnections();
                        }
                        return [2];
                }
            });
        });
    };
    Gateway.prototype.reportConnections = function () {
        var statusConnections = this.getStatusConnections();
        var shadowUpdate = {
            state: {
                reported: {
                    statusConnections: statusConnections,
                },
            },
        };
        this.publish(this.shadowTopic + "/update", shadowUpdate);
        this.emit(GatewayEvent.ConnectionsChanged, statusConnections);
    };
    Gateway.prototype.getStatusConnections = function () {
        var statusConnections = {};
        for (var _i = 0, _a = this.deviceConnections; _i < _a.length; _i++) {
            var connection = _a[_i];
            statusConnections[connection] = {
                id: connection,
                status: {
                    connected: true,
                },
            };
        }
        return statusConnections;
    };
    return Gateway;
}(events_1.EventEmitter));
exports.Gateway = Gateway;
