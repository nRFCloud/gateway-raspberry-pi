"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var EventType;
(function (EventType) {
    EventType["CharacteristicValueChanged"] = "device_characteristic_value_changed";
    EventType["DescriptorValueWrite"] = "device_descriptor_value_write_result";
    EventType["DescriptorValueRead"] = "device_descriptor_value_read_result";
    EventType["DescriptorValueChanged"] = "device_descriptor_value_changed";
    EventType["CharacteristicValueWrite"] = "device_characteristic_value_write_result";
    EventType["CharacteristicValueRead"] = "device_characteristic_value_read_result";
    EventType["DeviceDiscover"] = "device_discover_result";
    EventType["DeviceDisconnected"] = "device_disconnect";
    EventType["ScanResult"] = "scan_result";
    EventType["DeviceConnected"] = "device_connect_result";
    EventType["Error"] = "error";
})(EventType = exports.EventType || (exports.EventType = {}));
