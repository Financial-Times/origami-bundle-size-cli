'use strict';

const semver = require('semver');
const RepoDataClient = require('@financial-times/origami-repo-data-client');
const repoData = new RepoDataClient();
const buildServiceBundleSize = require('./build-service-bundle-size');

/**
 * @param {Version} version - The component version to get bundle information for.
 */
module.exports = async version => {
	const name = version.name;
	const brands = version.brands;
	const ref = version.ref;

	// Try Repo Data:
	// Repo data will return all bundle sizes in one request, if published.
	let repoDataError;
	try {
		if (!semver.valid(ref)) {
			throw new TypeError('Repo data requires a valid semver version.');
		}
		// Add language property to bundle size data as repo data doesn't return this.
		const css = await repoData.listBundles(name, ref, 'css');
		const js = await repoData.listBundles(name, ref, 'js');
		return [...js.map(b => {
			b.language = 'js';
			return b;
		}), ...css.map(b => {
			b.language = 'css';
			return b;
		})];
	} catch (error) {
		repoDataError = error;
	}

	// Try Build Service:
	// If the version is a commit hash or repo data failed for some reason use
	// the [Origami Build Service v2](https://www.ft.com/__origami/service/build/v2/)
	// to find bundle sizes.
	let buildServiceError;
	try {
		const css = await buildServiceBundleSize(name, ref, 'css', brands);
		const js = await buildServiceBundleSize(name, ref, 'js', brands);
		return [...js, ...css];
	} catch (error) {
		buildServiceError = error;
	}

	// Error if both failed.
	throw new Error(`Cound not get bundle information for ${name} at version ${ref}.\nBuild service: ${buildServiceError.message}.\nRepo data: ${repoDataError.message}.`);
};
