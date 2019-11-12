require('dotenv').config();

const { createGateway } = require('./src/device');

const configuration = {
	keyPath: process.env.PRIVATE_KEY_PATH,
	certPath: process.env.CLIENT_CERT_PATH,
	caPath: process.env.CA_CERT_PATH,
	clientId: process.env.CLIENT_ID,
	host: process.env.HOST,
	stage: process.env.ENVIRONMENT_STAGE,
	tenantId: process.env.TENANT_ID,
	onMessage: (topic, payload) => console.info(topic, payload.toString()),
	onError: (error) => console.error(error),
};

const gateway = createGateway(configuration);

