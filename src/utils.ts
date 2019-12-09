
//nRF Cloud expects uuids to be upper case with no dashes
export function shortenUUID(uuid: string) {
	return uuid.replace(/-/g, '').toUpperCase();
}
