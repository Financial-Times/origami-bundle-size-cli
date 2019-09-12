const fetch = require('node-fetch');

/**
 * Get bundle size information (css or js) for a name by brand at a
 * given commit hash.
 *
 * @param {string} name - the component name.
 * @param {string} version - the tag, branch, or commit hash.
 * @param {string} language - the language i.e. 'css' or 'js'.
 * @param {string} brand [null] - the brand e.g. 'internal' (optional).
 * @return {object} - bundle information.
 */
async function getBundleInfo(name, version, language, brand = null) {
	const buildServiceUrl = new URL(`https://www.ft.com/__origami/service/build/v2/bundles/${language}`);
	buildServiceUrl.searchParams.append('modules', `${name}@${version}`);
	if (brand) {
		buildServiceUrl.searchParams.append('brand', brand);
	}
	// Find bundle sizes for differing "Accept-Encoding" values.
	// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding
	const sizes = {};
	for (const encoding of ['', 'gzip']) {
		try {
			// Consider parallelising:
			// eslint-disable-next-line no-await-in-loop
			const response = await fetch(buildServiceUrl.toString(), {
				method: 'HEAD',
				headers: {
					'Accept-Encoding': encoding
				}
			});
			if (!response.ok) {
				const responseError = new Error('Could not get bundle from the Origami Build Service.');
				responseError.status = response.status;
				throw responseError;
			}
			sizes[encoding || 'raw'] = response.headers.get('content-length');
		} catch (error) {
			const buildServiceError = new Error(`Unable to load ${encoding || 'non-encoded'} bundle from ${buildServiceUrl.toString()}${error.status ? ` (status: ${error.status}).` : ''}`);
			throw buildServiceError;
		}
	}

	return {
		language,
		brand,
		sizes,
		url: buildServiceUrl.toString(),
	};
}

/**
 * Get bundle size information (css or js) for a name by brand at a
 * given commit hash.
 *
 * @param {string} name - the component name.
 * @param {string} version - the tag, branch, or commit hash.
 * @param {string} language - the language i.e. 'css' or 'js'.
 * @param {array<string>} brands - the brands the name supports e.g. ['internal'], empty if unbranded
 * @return {object} - bundle information.
 */
module.exports = async (name, version, language, brands) => {
	// only css is branded at time of writing
	if (brands.length === 0 || language !== 'css') {
		brands = [null];
	}
	// get bundles for each brand
	const bundles = [];
	for await (const brand of brands) {
		const bundle = await getBundleInfo(name, version, language, brand);
		bundles.push(bundle);
	}
	return bundles;
};
