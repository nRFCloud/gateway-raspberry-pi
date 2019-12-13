"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventType;
(function (EventType) {
    EventType["DescriptorValueWrite"] = "device_descriptor_value_write_result";
    EventType["DescriptorValueRead"] = "device_descriptor_value_read_result";
    EventType["CharacteristicValueWrite"] = "device_characteristic_value_write_result";
    EventType["CharacteristicValueRead"] = "device_characteristic_value_read_result";
    EventType["DeviceDiscover"] = "device_discover_result";
    EventType["DeviceDisconnected"] = "device_disconnect";
    EventType["ScanResult"] = "scan_result";
    EventType["DeviceConnected"] = "device_connect_result";
})(EventType || (EventType = {}));
var MqttFacade = (function () {
    function MqttFacade(mqttClient, g2cTopic, gatewayId) {
        this.messageId = 0;
        this.g2cTopic = g2cTopic;
        this.mqttClient = mqttClient;
        this.gatewayId = gatewayId;
    }
    Object.defineProperty(MqttFacade.prototype, "shadowTopic", {
        get: function () {
            return "$aws/things/" + this.gatewayId + "/shadow";
        },
        enumerable: true,
        configurable: true
    });
    MqttFacade.prototype.handleScanResult = function (result, timeout) {
        if (timeout === void 0) { timeout = false; }
        var event = {
            type: EventType.ScanResult,
            subType: 'instant',
            devices: result ? [result] : [],
            timeout: timeout,
        };
        this.publishG2CEvent(event);
    };
    MqttFacade.prototype.reportConnections = function (statusConnections) {
        var shadowUpdate = {
            state: {
                reported: {
                    statusConnections: statusConnections,
                },
            },
        };
        this.publish(this.shadowTopic + "/update", shadowUpdate);
    };
    MqttFacade.prototype.reportConnectionUp = function (deviceId) {
        var event = {
            type: EventType.DeviceConnected,
            device: this.buildDeviceObjectForEvent(deviceId, true),
        };
        this.publishG2CEvent(event);
    };
    MqttFacade.prototype.reportConnectionDown = function (deviceId) {
        var event = {
            type: EventType.DeviceDisconnected,
            device: this.buildDeviceObjectForEvent(deviceId, false),
        };
        this.publishG2CEvent(event);
    };
    MqttFacade.prototype.reportDiscover = function (deviceId, services) {
        var discoverEvent = {
            type: EventType.DeviceDiscover,
            device: this.buildDeviceObjectForEvent(deviceId, true),
            services: services,
        };
        this.publishG2CEvent(discoverEvent);
    };
    MqttFacade.prototype.reportError = function (err, id, code, deviceId) {
        code = typeof code !== 'undefined' ? code : -1;
        err = typeof err === 'object' && err !== null ? JSON.stringify(err) : err;
        this.publishG2CEvent({
            type: 'error',
            error: {
                description: err,
                code: code,
            },
            device: deviceId ? {
                deviceAddress: deviceId,
            } : undefined,
        });
    };
    MqttFacade.prototype.reportCharacteristicRead = function (deviceId, characteristic) {
        var charEvent = {
            type: EventType.CharacteristicValueRead,
            characteristic: characteristic,
            device: this.buildDeviceObjectForEvent(deviceId, true),
        };
        this.publishG2CEvent(charEvent);
    };
    MqttFacade.prototype.reportCharacteristicWrite = function (deviceId, characteristic) {
        var event = {
            type: EventType.CharacteristicValueWrite,
            characteristic: characteristic,
            device: this.buildDeviceObjectForEvent(deviceId, true),
        };
        this.publishG2CEvent(event);
    };
    MqttFacade.prototype.reportDescriptorRead = function (deviceId, descriptor) {
        var event = {
            type: EventType.DescriptorValueRead,
            descriptor: descriptor,
            device: this.buildDeviceObjectForEvent(deviceId, true),
        };
        this.publishG2CEvent(event);
    };
    MqttFacade.prototype.reportDescriptorWrite = function (deviceId, descriptor) {
        var event = {
            type: EventType.DescriptorValueWrite,
            descriptor: descriptor,
            device: this.buildDeviceObjectForEvent(deviceId, true),
        };
        this.publishG2CEvent(event);
    };
    MqttFacade.prototype.publishG2CEvent = function (event) {
        var g2cEvent = this.getG2CEvent(event);
        this.publish(this.g2cTopic, g2cEvent);
    };
    MqttFacade.prototype.getG2CEvent = function (event) {
        if (!event.timestamp) {
            event.timestamp = new Date().toISOString();
        }
        return {
            type: 'event',
            gatewayId: this.mqttClient.clientId,
            event: event,
        };
    };
    MqttFacade.prototype.publish = function (topic, event) {
        event.messageId = this.messageId++;
        var message = JSON.stringify(event);
        this.mqttClient.publish(topic, message);
    };
    MqttFacade.prototype.buildDeviceObjectForEvent = function (deviceId, connected) {
        return {
            address: {
                address: deviceId,
                type: 'randomStatic',
            },
            id: deviceId,
            status: {
                connected: connected,
            },
        };
    };
    return MqttFacade;
}());
exports.MqttFacade = MqttFacade;
