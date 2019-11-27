"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var awsIot = __importStar(require("aws-iot-device-sdk"));
var Gateway = (function () {
    function Gateway(config) {
        var _this = this;
        this.messageId = 0;
        console.info('got config object', config);
        this.keyPath = config.keyPath;
        this.certPath = config.certPath;
        this.caPath = config.caPath;
        this.gatewayId = config.gatewayId;
        this.host = config.host;
        this.stage = config.stage;
        this.tenantId = config.tenantId;
        this.bluetoothAdapter = config.bluetoothAdapter;
        this.gatewayDevice = new awsIot.device({
            keyPath: this.keyPath,
            certPath: this.certPath,
            caPath: this.caPath,
            clientId: this.gatewayId,
            host: this.host,
        });
        this.gatewayDevice.on('connect', function () {
            console.log('connect');
            _this.gatewayDevice.publish(_this.shadowGetTopic, '');
        });
        this.gatewayDevice.on('message', function (topic, payload) {
            _this.handleMessage(topic, payload);
        });
        this.gatewayDevice.on('error', this.handleError);
        this.gatewayDevice.subscribe(this.c2gTopic);
        this.gatewayDevice.subscribe(this.shadowGetTopic + "/accepted");
        this.gatewayDevice.subscribe(this.shadowUpdateTopic);
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
    Gateway.prototype.onDelete = function (handler) {
        this.deleteHandler = handler;
    };
    Gateway.prototype.handleMessage = function (topic, payload) {
        var message = JSON.parse(payload);
        if (topic === this.c2gTopic) {
            this.handleC2GMessage(message);
        }
        if (topic.indexOf(this.shadowTopic) === 0) {
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
                if (typeof this.deleteHandler === 'function') {
                    this.deleteHandler();
                }
                break;
        }
    };
    Gateway.prototype.handleShadowMessage = function (message) {
        console.log('got shadow message', JSON.stringify(message));
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
    return Gateway;
}());
exports.Gateway = Gateway;
