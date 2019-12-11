"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function shortenUUID(uuid) {
    return uuid.replace(/-/g, '').toUpperCase();
}
exports.shortenUUID = shortenUUID;
