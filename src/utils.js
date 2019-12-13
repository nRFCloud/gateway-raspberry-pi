"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function shortenUUID(uuid) {
    return uuid.replace(/-/g, '').toUpperCase();
}
exports.shortenUUID = shortenUUID;
function assumeType(x) {
    return;
}
exports.assumeType = assumeType;
function convertDescriptor(descriptor) {
    return {
        path: descriptor.path,
        uuid: descriptor.uuid,
        value: descriptor.value,
    };
}
function convertDescriptors(descriptors) {
    var retval = {};
    for (var _i = 0, descriptors_1 = descriptors; _i < descriptors_1.length; _i++) {
        var descriptor = descriptors_1[_i];
        retval[descriptor.uuid] = convertDescriptor(descriptor);
    }
    return retval;
}
function convertCharacteristic(characteristic) {
    var properties = {
        authorizedSignedWrite: characteristic.properties.auth_signed_wr,
        indicate: characteristic.properties.indicate,
        notify: characteristic.properties.notify,
        read: characteristic.properties.read,
        write: characteristic.properties.write,
        writeWithoutResponse: characteristic.properties.write_wo_resp,
    };
    return {
        uuid: characteristic.uuid,
        path: characteristic.path,
        value: characteristic.value,
        properties: properties,
        descriptors: convertDescriptors(characteristic.descriptors),
    };
}
function convertCharacteristics(characteristics) {
    var retval = null;
    if (characteristics && characteristics.length) {
        for (var _i = 0, characteristics_1 = characteristics; _i < characteristics_1.length; _i++) {
            var characteristic = characteristics_1[_i];
            retval[characteristic.uuid] = convertCharacteristic(characteristic);
        }
    }
    return retval;
}
function convertService(service) {
    return {
        uuid: service.uuid,
        characteristics: convertCharacteristics(service.characteristics),
    };
}
function convertServices(services) {
    var retval = {};
    if (services && services.length) {
        for (var _i = 0, services_1 = services; _i < services_1.length; _i++) {
            var service = services_1[_i];
            retval[service.uuid] = convertService(service);
        }
    }
    return retval;
}
exports.convertServices = convertServices;
