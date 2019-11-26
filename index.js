require('dotenv').config();

const bluetoothInterface = require('./src/bluetoothInterface');
const { createGateway } = require('./src/gateway');

const configuration = {
	keyPath: process.env.PRIVATE_KEY_PATH,
	certPath: process.env.CLIENT_CERT_PATH,
	caPath: process.env.CA_CERT_PATH,
	clientId: process.env.CLIENT_ID,
	host: process.env.HOST,
	stage: process.env.ENVIRONMENT_STAGE,
	tenantId: process.env.TENANT_ID,
	bluetoothHandler: bluetoothInterface
};

const gateway = createGateway(configuration);

