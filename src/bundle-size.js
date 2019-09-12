const semver = require('semver');
const RepoDataClient = require('@financial-times/origami-repo-data-client');
const repoData = new RepoDataClient({
	apiKey: process.env.REPO_DATA_API_KEY,
	apiSecret: process.env.REPO_DATA_API_SECRET
});
const fetchBundleSizeFromBuildService = require('./build-service-bundle-size');

/**
 * @param {LocalComponent|RemoteComponent} component - The component to get bundle information for.
 */
module.exports = async component => {
	const name = component.name;
	const brands = component.brands;
	const version = component.version;

	const bundles = {
		css: [],
		js: []
	};

	// Try Repo Data:
	// Repo data will return all bundle sizes in one request, if published.
	let repoDataError;
	try {
		if (!semver.valid(version)) {
			throw new TypeError('Repo data requires a valid semver version.');
		}
		bundles.css = await repoData.listBundles(name, version, 'css');
		bundles.js = await repoData.listBundles(name, version, 'js');
	} catch (error) {
		repoDataError = error;
	}

	// Try Build Service:
	// If the version is a commit hash or repo data failed for some reason use
	// the [Origami Build Service v2](https://www.ft.com/__origami/service/build/v2/)
	// to find bundle sizes.
	let buildServiceError;
	try {
		bundles.css = await fetchBundleSizeFromBuildService(name, version, 'css', brands);
		bundles.js = await fetchBundleSizeFromBuildService(name, version, 'js', brands);
	} catch (error) {
		buildServiceError = error;
	}

	// Error if both failed.
	if (buildServiceError && repoDataError) {
		throw new Error(`Cound not get bundle information for ${name} at version ${version}.\nBuild service: ${buildServiceError.message}.\nRepo data: ${repoDataError.message}.`);
	}

	// Return all bundles together with a language property.
	return [
		...bundles.js.map(b => {
			b.language = 'js';
			return b;
		}),
		...bundles.css.map(b => {
			b.language = 'css';
			return b;
		})
	];
};
