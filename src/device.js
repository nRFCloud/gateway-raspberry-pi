require('dotenv').config();
const awsIot = require('aws-iot-device-sdk');

const CLIENTID = process.env.CLIENT_ID;
const ENVIRONMENT_STAGE = process.env.ENVIRONMENT_STAGE;
const TENANTID = process.env.TENANT_ID;

const device = new awsIot.device({
	keyPath: process.env.PRIVATE_KEY_PATH,
	certPath: process.env.CLIENT_CERT_PATH,
	caPath: process.env.CA_CERT_PATH,
	clientId: CLIENTID,
	host: process.env.HOST,
});

const shadowDataBaseTopic = `$aws/things/${CLIENTID}/shadow`;
device.subscribe(`${shadowDataBaseTopic}/get/accepted`);
device.subscribe(`${shadowDataBaseTopic}/update/delta`);

//Need to subscribe to c2g topic
const c2gTopic = `${ENVIRONMENT_STAGE}/${TENANTID}/gateways/${CLIENTID}/c2g`;
device.subscribe(c2gTopic);
device.on('connect', function() {
	console.log('connect');
	device.publish(`${shadowDataBaseTopic}/get`, '');
});

device.on('message', function(topic, payload) {
	console.log('message', topic, payload.toString());
});

device.on('error', (error) => {
	console.error(error);
});
