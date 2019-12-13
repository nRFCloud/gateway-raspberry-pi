"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Descriptor = (function () {
    function Descriptor(uuid, characteristicUuid, serviceUuid) {
        if (characteristicUuid === void 0) { characteristicUuid = null; }
        if (serviceUuid === void 0) { serviceUuid = null; }
        this.uuid = uuid;
        if (characteristicUuid && serviceUuid) {
            this.path = serviceUuid + "/" + characteristicUuid + "/" + uuid;
        }
    }
    return Descriptor;
}());
exports.Descriptor = Descriptor;
var CharacteristicProperties = (function () {
    function CharacteristicProperties() {
    }
    return CharacteristicProperties;
}());
exports.CharacteristicProperties = CharacteristicProperties;
var Characteristic = (function () {
    function Characteristic(uuid, serviceUuid) {
        if (serviceUuid === void 0) { serviceUuid = null; }
        this.uuid = uuid;
        if (serviceUuid) {
            this.path = serviceUuid + "/" + uuid;
        }
    }
    return Characteristic;
}());
exports.Characteristic = Characteristic;
var Service = (function () {
    function Service(uuid) {
        this.uuid = uuid;
    }
    return Service;
}());
exports.Service = Service;
