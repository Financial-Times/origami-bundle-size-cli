'use strict';

// The size (kb) to count as a significant bundles size change.
const threshold = 0.2;

/**
 * Get the bundle size difference between two bundles in KB.
 * @param {Object} current - The more recent bundle for comparison.
 * @param {Object} previous - The bundle which pre-dates the current bundle.
 * @param {String} compression [null] - The compression level to compare, i.e 'gzip'.
 * @return {String}
 */
function getSizeDiff(current, previous, compression) {
	compression = compression || 'raw';
	const currentContentLength = current.sizes[compression];
	const previousContentLength = previous.sizes[compression];
	return ((currentContentLength - previousContentLength) / 1024).toFixed(2);
}

/**
 * Get a message to describe the bundle size difference between two sets of bundles.
 * @param {Object} current - The more recent bundle for comparison.
 * @param {Object} previous - The bundle which pre-dates the current bundle.
 * @return {String}
 */
function getBundleComparisonMessage(current, previous) {
	const rawDiff = getSizeDiff(current, previous);
	const gzipDiff = getSizeDiff(current, previous, 'gzip');

	// Use the current brand in the key in case the previous version is unbranded,
	// but the current version has just added brand support.
	const key = `${current.language}${current.brand ? `, ${current.brand}` : ''}`;

	if (Math.abs(rawDiff) === 0) {
		return `${key}: no difference.`;
	}

	if (Math.abs(rawDiff) < threshold) {
		return `${key}: no significant difference.`;
	}

	const raw = `${Math.abs(rawDiff)}kb ${rawDiff < 0 ? 'decrease' : 'increase'}`;
	const gzip = `(${gzipDiff}kb/gzip)`;
	return `${key}: ${raw} ${gzip}`;
}

module.exports = (fromBundles, toBundles) => {
	// Find a matching bundle from a previous version to compare with the
	// current bundle. Compare bundles of the same language and brand, or
	// unbranded versions against the master brand of a branded version.
	const bundleComparisons = toBundles.map(current => {
		const previous = fromBundles.find(previous => (
			previous.language === current.language &&
			(previous.brand === current.brand || (previous.brand === null && current.brand === 'master'))
		));
		return {
			current,
			previous
		};
	}).filter(b => b.previous);

	// Message if no bundle sizes have changes at all.
	const noBundleSizeChanges = bundleComparisons.every(c => {
		const rawDiff = getSizeDiff(c.current, c.previous);
		return Math.abs(rawDiff) === 0;
	});

	if (noBundleSizeChanges) {
		return 'No bundle size differences found.';
	}

	// Message if only small bundle size differences, which are not significant.
	const significantComparisons = bundleComparisons.filter(c => {
		const rawDiff = getSizeDiff(c.current, c.previous);
		return Math.abs(rawDiff) > threshold;
	});

	if (significantComparisons.length === 0) {
		return 'No significant bundle size differences found.';
	}

	// Message when at least some bundles have significantly changed.
	// Only get messages for bundles which do have a significant difference.
	let message = significantComparisons.map(c => {
		return getBundleComparisonMessage(c.current, c.previous);
	}).join('\n');

	// But note the bundles with an insignificant difference.
	const insignificantComparisons = bundleComparisons.filter(c =>
		!significantComparisons.includes(c)
	);
	if (insignificantComparisons.length !== 0) {
		message = `${message}\n` +
			'An insignificant difference was also found for: ' +
			insignificantComparisons.map(c =>
				`${c.current.language}${c.current.brand ? ` (${c.current.brand})` : ''}`
			).join(', ');
	}

	return message;
};
