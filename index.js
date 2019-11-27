"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config();
var gateway_1 = require("./src/gateway");
var exampleAdapter_1 = require("./src/adapters/exampleAdapter");
var nobleAdapter_1 = require("./src/adapters/nobleAdapter");
function main(useNoble) {
    if (useNoble === void 0) { useNoble = false; }
    var configuration = {
        keyPath: process.env.PRIVATE_KEY_PATH,
        certPath: process.env.CLIENT_CERT_PATH,
        caPath: process.env.CA_CERT_PATH,
        gatewayId: process.env.GATEWAY_ID,
        host: process.env.HOST,
        stage: process.env.ENVIRONMENT_STAGE,
        tenantId: process.env.TENANT_ID,
        bluetoothAdapter: useNoble ? new nobleAdapter_1.NobleAdapter() : new exampleAdapter_1.ExampleAdapter(),
    };
    var gateway = new gateway_1.Gateway(configuration);
    gateway.onDelete(function () {
        process.exit();
    });
}
main(process.argv.includes('noble'));
