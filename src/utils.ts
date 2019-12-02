export function arrayDeepEquals(left: any[], right: any[]): boolean {
	if (left.length !== right.length) {
		return false;
	}

	for (const lItem of left) {
		if (right.indexOf(lItem) < 0) {
			return false;
		}
	}

	for (const rItem of right) {
		if (left.indexOf(rItem) < 0) {
			return false;
		}
	}

	return true;
}
