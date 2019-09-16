'use strict';

function getSizeDiff(current, previous) {
	return ((current - previous) / 1024).toFixed(2);
}

function getMessage(current, previous, brand) {
	const gzipDiff = getSizeDiff(current.sizes.gzip, previous.sizes.gzip);
	const rawDiff = getSizeDiff(current.sizes.raw, previous.sizes.raw);

	if (Math.abs(rawDiff) < 0.5) {
		return ''; // no significant chnage, -0.5kb
	}

	const key = `${previous.language}${brand ? `, ${brand}` : ''}:`;
	const raw = `${Math.abs(rawDiff)}kb ${rawDiff < 0 ? 'decrease' : 'increase'}`;
	const gzip = `(${gzipDiff}kb/gzip)`;

	return [
		key,
		raw,
		gzip
	].filter(m => m).join(' ');
}

module.exports = (fromBundles, toBundles) => {
	let message = '';
	toBundles.forEach(current => {
		const brand = current.brand;
		const previous = fromBundles.find(previous => (
			previous.language === current.language &&
			(previous.brand === current.brand || (previous.brand === null && current.brand === 'master'))
		));
		if (previous) {
			const part = getMessage(current, previous, brand);
			if (part) {
				message += (message ? '\n' + part : part);
			}
		}
	});
	return message || 'No bundle size difference found.';
};
