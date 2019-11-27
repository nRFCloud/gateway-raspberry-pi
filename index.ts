require('dotenv').config({path: './prod.env'});

import { Gateway, GatewayConfiguration } from './src/gateway';

function main() {
	const configuration: GatewayConfiguration = {
		keyPath: process.env.PRIVATE_KEY_PATH,
		certPath: process.env.CLIENT_CERT_PATH,
		caPath: process.env.CA_CERT_PATH,
		gatewayId: process.env.GATEWAY_ID,
		host: process.env.HOST,
		stage: process.env.ENVIRONMENT_STAGE,
		tenantId: process.env.TENANT_ID,
	};
	const gateway = new Gateway(configuration);
}

main();
