require('dotenv').config();

const { createGateway } = require('./src/gateway');
const { handleC2GMessage } = require('./src/messageHandler');

const configuration = {
	keyPath: process.env.PRIVATE_KEY_PATH,
	certPath: process.env.CLIENT_CERT_PATH,
	caPath: process.env.CA_CERT_PATH,
	clientId: process.env.CLIENT_ID,
	host: process.env.HOST,
	stage: process.env.ENVIRONMENT_STAGE,
	tenantId: process.env.TENANT_ID,
	onMessage: handleG2CMessage,
	onShadowMessage: handleShadowMessage,
	onError: (error) => console.error('Error from MQTT', error),
};

function handleG2CMessage(message) {
	console.info('g2c message', message);
	handleC2GMessage(message);
}

function handleShadowMessage(message) {
	console.info('shadow message', message);
}

const gateway = createGateway(configuration);

