const awsIot = require('aws-iot-device-sdk');

function createGateway(configuration) {
	const keyPath = configuration.keyPath || process.env.PRIVATE_KEY_PATH;
	const certPath = configuration.certPath || process.env.CLIENT_CERT_PATH;
	const caPath = configuration.caPath || process.env.CA_CERT_PATH;
	const clientId = configuration.clientId || process.env.CLIENT_ID;
	const host = configuration.host || process.env.HOST;
	const stage = configuration.stage || process.env.ENVIRONMENT_STAGE;
	const tenantId = configuration.tenantId || process.env.TENANT_ID;

	const messageCallback = configuration.onMessage || function () {
	};
	const errorCallback = configuration.onError || function (error) {
		console.error(error);
	};

	const device = new awsIot.device({
		keyPath: keyPath,
		certPath: certPath,
		caPath: caPath,
		clientId: clientId,
		host: host,
	});

	device.on('connect', function() {
		console.log('connect');
		device.publish(`${shadowDataBaseTopic}/get`, '');
	});

	device.on('message', messageCallback);

	device.on('error', errorCallback);

	const shadowDataBaseTopic = `$aws/things/${clientId}/shadow`;
	device.subscribe(`${shadowDataBaseTopic}/get/accepted`);
	device.subscribe(`${shadowDataBaseTopic}/update/delta`);

//Need to subscribe to c2g topic
	const c2gTopic = `${stage}/${tenantId}/gateways/${clientId}/c2g`;
	device.subscribe(c2gTopic);

	return device;
}

exports.createGateway = createGateway;
