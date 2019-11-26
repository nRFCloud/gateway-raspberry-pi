//Messages must already be JSON.parsed

const {startScan} = require('./bluetoothInterface');
exports.handleC2GMessage = handleC2GMessage;

//The c2g topic is for messages destined for devices (except for a couple)
//Results from the operations will be reported over the g2c topic
function handleC2GMessage(message) {
	if (!message || !message.type || !message.id || message.type !== 'operation' || !message.operation || !message.operation.type) {
		throw new Error('Unknown message ' + JSON.stringify(message));
	}
	const op = message.operation;
	switch (op.type) {
		case 'scan': //Do a bluetooth scan
			startScan(op.scanTimeout, op.scanMode, op.scanType, op.scanInterval, op.scanReporting, op.filter);
			break;
		case 'device_discover': //Do a discover AND full value read
			break;
		case 'device_characteristic_value_read': //Read a characteristic
			break;
		case 'device_characteristic_value_write': //Write value to a characteristic
			break;
		case 'device_descriptor_value_read': //Read a descriptor
			break;
		case 'device_descriptor_value_write': //Write value to a descriptor
			break;
		case 'get_gateway_status': //Get information about the gateway
			break;
		case 'delete_yourself': //User has deleted this gateway from their account
			break;
	}
}
