import isElevated from 'is-elevated';
import { Gateway, GatewayConfiguration, GatewayEvent } from '@nrfcloud/gateway-common';
import { NobleAdapter } from './src/adapters/nobleAdapter';
import { ExampleAdapter } from './src/adapters/exampleAdapter';
const fs = require('fs');

require('dotenv').config();

async function main(useNoble: boolean = true) {
	if (!(await isElevated())) {
		console.error('You need to run this as root (sudo)');
		process.exit(1);
	}

	const keyExists = fs.existsSync(process.env.PRIVATE_KEY_PATH);
	const clientCertExists = fs.existsSync(process.env.CLIENT_CERT_PATH);
	const caCertExists = fs.existsSync(process.env.CA_CERT_PATH)

	if (
		!keyExists ||
		!clientCertExists ||
		!caCertExists
	) {
		console.error(`One or more required files are missing${keyExists ? '' : '\nPrivate key'}${clientCertExists ? '' : '\nClient Certificate'}${caCertExists ? '' : '\nCA Certificate'}`);
		process.exit(1);
	}

	const configuration: GatewayConfiguration = {
		keyPath: `./${process.env.PRIVATE_KEY_PATH}`,
		certPath: `./${process.env.CLIENT_CERT_PATH}`,
		caPath: `./${process.env.CA_CERT_PATH}`,
		gatewayId: process.env.GATEWAY_ID,
		host: process.env.HOST,
		stage: process.env.ENVIRONMENT_STAGE,
		tenantId: process.env.TENANT_ID,
		bluetoothAdapter: useNoble ? new NobleAdapter() : new ExampleAdapter(),
		protocol: 'mqtts',
		debug: true,
	};
	console.info('Config is', configuration);
	const gateway = new Gateway(configuration);

	gateway.on(GatewayEvent.Deleted, () => {
		process.exit();
	});

	gateway.on(GatewayEvent.NameChanged, (newName: string) => {
		console.log(`Gateway name changed to ${newName}`);
	});
}

main(!process.argv.includes('example'));
