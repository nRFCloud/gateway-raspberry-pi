# gateway-raspberry-pi
A BLE gateway implementation that can run on Raspberry PI (headless)

To use:
1. Create a gateway using the IRIS Rest API `tenantsTenantIdGatewaysPost`
1. Save the returned information
1. Copy .env.sample
1. Fill in the appropriate details
1. Build code: `npm run build`
1. Run gateway: `npm run start`
    1. If you want to use the "Noble" adapter, run: `npm run start -- noble`
1. The gateway should start and it should connect immediately
