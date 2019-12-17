import { Gateway, GatewayConfiguration, GatewayEvent } from 'gateway-common';
import { NobleAdapter } from './src/adapters/nobleAdapter';
import { ExampleAdapter } from './src/adapters/exampleAdapter';

require('dotenv').config();

function main(useNoble: boolean = true) {
	const configuration: GatewayConfiguration = {
		keyPath: process.env.PRIVATE_KEY_PATH,
		certPath: process.env.CLIENT_CERT_PATH,
		caPath: process.env.CA_CERT_PATH,
		gatewayId: process.env.GATEWAY_ID,
		host: process.env.HOST,
		stage: process.env.ENVIRONMENT_STAGE,
		tenantId: process.env.TENANT_ID,
		bluetoothAdapter: useNoble ? new NobleAdapter() : new ExampleAdapter(),
	};
	const gateway = new Gateway(configuration);

	gateway.on(GatewayEvent.Deleted, () => {
		process.exit();
	});

	gateway.on(GatewayEvent.NameChanged, (newName: string) => {
		console.log(`Gateway name changed to ${newName}`);
	});
}

main(!process.argv.includes('example'));
