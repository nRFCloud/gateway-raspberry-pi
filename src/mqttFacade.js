"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventType;
(function (EventType) {
    EventType["DeviceDiscover"] = "device_discover_result";
    EventType["DeviceDisconnected"] = "device_disconnect";
    EventType["ScanResult"] = "scan_result";
    EventType["DeviceConnected"] = "device_connect_result";
})(EventType || (EventType = {}));
var MqttFacade = (function () {
    function MqttFacade(mqttClient, g2cTopic) {
        this.messageId = 0;
        this.g2cTopic = g2cTopic;
        this.mqttClient = mqttClient;
    }
    Object.defineProperty(MqttFacade.prototype, "shadowTopic", {
        get: function () {
            return "$aws/things/" + this.mqttClient.clientId + "/shadow";
        },
        enumerable: true,
        configurable: true
    });
    MqttFacade.prototype.handleScanResult = function (result, timeout) {
        if (timeout === void 0) { timeout = false; }
        var scanEvent = {
            type: EventType.ScanResult,
            subType: 'instant',
            devices: result ? [result] : [],
            timeout: timeout,
        };
        var g2cEvent = this.getG2CEvent(scanEvent);
        this.publish(this.g2cTopic, g2cEvent);
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
        var connectionUpEvent = {
            type: EventType.DeviceConnected,
            device: this.buildDeviceObjectForEvent(deviceId, true),
        };
        var g2cEvent = this.getG2CEvent(connectionUpEvent);
        this.publish(this.g2cTopic, g2cEvent);
    };
    MqttFacade.prototype.reportConnectionDown = function (deviceId) {
        var connectionUpEvent = {
            type: EventType.DeviceDisconnected,
            device: this.buildDeviceObjectForEvent(deviceId, false),
        };
        var g2cEvent = this.getG2CEvent(connectionUpEvent);
        this.publish(this.g2cTopic, g2cEvent);
    };
    MqttFacade.prototype.reportDiscover = function (deviceId, services) {
        var discoverEvent = {
            type: EventType.DeviceDiscover,
            device: this.buildDeviceObjectForEvent(deviceId, true),
            services: services,
        };
        var g2cEvent = this.getG2CEvent(discoverEvent);
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
