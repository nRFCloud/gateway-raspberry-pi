exports.startScan = startScan;

/**
 *
 * @param scanTimeout When the scan should timeout, in seconds (default 3)
 * @param scanMode Scan mode: active or passive (default active)
 * @param scanType Type of scan: 0 for "regular", 1 for "beacons" (default 0)
 * @param scanInterval Ignored
 * @param scanReporting When results should be reported: "instant" or "batch" (default instant)
 * @param filter An object: {rssi, name}. If set, results should only be reported if they are higher then sent rssi and/or match name
 */
function startScan(scanTimeout, scanMode, scanType, scanInterval, scanReporting, filter) {
	console.info('starting scan with params', arguments);
}
