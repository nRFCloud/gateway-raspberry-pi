"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require('dotenv').config({ path: './prod.env' });
var gateway_1 = require("./src/gateway");
function main() {
    var configuration = {
        keyPath: process.env.PRIVATE_KEY_PATH,
        certPath: process.env.CLIENT_CERT_PATH,
        caPath: process.env.CA_CERT_PATH,
        gatewayId: process.env.GATEWAY_ID,
        host: process.env.HOST,
        stage: process.env.ENVIRONMENT_STAGE,
        tenantId: process.env.TENANT_ID,
    };
    var gateway = new gateway_1.Gateway(configuration);
}
main();
