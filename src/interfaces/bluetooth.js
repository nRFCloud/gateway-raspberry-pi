"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Descriptor = (function () {
    function Descriptor(uuid) {
        this.uuid = uuid;
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
    function Characteristic(uuid) {
        this.uuid = uuid;
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
