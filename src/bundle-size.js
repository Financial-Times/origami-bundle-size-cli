const semver = require('semver');

const RepoDataClient = require('@financial-times/origami-repo-data-client');
const repoData = new RepoDataClient({
	apiKey: process.env.REPO_DATA_API_KEY,
	apiSecret: process.env.REPO_DATA_API_SECRET
});

const fetchBundleSizeFromBuildService = require('./build-service-bundle-size');

module.exports = async (component, version, brands) => {

	const bundles = {
		css: [],
		js: []
	};

	// Try Repo Data
	let repoDataError;
	try {
		if (!semver.valid(version)) {
			throw new TypeError('Need a valid semver version for repo data.');
		}
		bundles.css = await repoData.listBundles(component, version, 'css');
		bundles.js = await repoData.listBundles(component, version, 'js');
	} catch (error) {
		repoDataError = error;
	}

	// Try Build Service
	let buildServiceError;
	try {
		bundles.css = await fetchBundleSizeFromBuildService(component, version, 'css', brands);
		bundles.js = await fetchBundleSizeFromBuildService(component, version, 'js', brands);
	} catch (error) {
		buildServiceError = error;
	}

	// Error if both failed.
	if (buildServiceError && repoDataError) {
		throw new Error(`Cound not get bundle information for ${component} at version ${version}. Build service: ${buildServiceError.message}. Repo data: ${repoDataError.message}.`);
	}

	return bundles;
};
