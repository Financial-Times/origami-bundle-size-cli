'use strict';

const semver = require('semver');
const RepoDataClient = require('@financial-times/origami-repo-data-client');
const repoData = new RepoDataClient();

/**
 * @param {Version} version - The component version to get bundle information for.
 */
module.exports = async version => {
	const name = version.name;
	const ref = version.ref;

	if (!semver.valid(ref)) {
		throw new TypeError('Repo data requires a valid semver version.');
	}

	// Repo data will return all bundle sizes in one request, if published.
	try {
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
		throw new Error(`Cound not get bundle information for ${name} at ` +
		`version ${ref}.\nOrigami Repo Data returned the following error: ` +
		error.message);
	}
};
