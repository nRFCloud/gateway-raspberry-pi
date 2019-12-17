# gateway-raspberry-pi
A BLE gateway implementation for nRF Cloud that can run on Raspberry PI (headless)

To use:
1. Install the [Noble](https://github.com/noble/noble) prerequisites: `sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev`
1. Clone or download this repo (`git clone git@github.com:nRFCloud/gateway-raspberry-pi.git`)
1. Create a gateway using `npx @nrfcloud/gateway-registration`, make sure you have an account on nRF Cloud and use the same credentials
1. The result of the command will be in `./result`
1. Copy the files to the root of this project (same directory as this README)
1. Run `npm install`
1. Build code: `npm run build`
1. Run gateway: `sudo npm run start` (sudo is necessary for Noble
    1. If you want to use the "Example" adapter, run: `npm run start -- example`
1. The gateway should start and it should connect immediately
