'use strict';

const fs = require('fs');
const execa = require('execa');
const semver = require('semver');
const RepoDataClient = require('@financial-times/origami-repo-data-client');
const repoData = new RepoDataClient({
	apiKey: process.env.REPO_DATA_API_KEY,
	apiSecret: process.env.REPO_DATA_API_SECRET
});

/**
 * @return {object} - The component's bower.json
 */
function getBower() {
	try {
		const data = fs.readFileSync('./bower.json', 'utf8');
		return JSON.parse(data);
	} catch (error) {
		throw new TypeError('Could not parse the component\'s bower.json.');
	}
}

/**
 * @return {string} - The name of the component in the directory.
 */
function getName() {
	const bower = getBower();
	if (typeof bower.name !== 'string') {
		throw new TypeError('Name not found in bower.json');
	}
	return bower.name;
}

/**
 * @return {object} - The component's origami.json
 */
function getOrigamiManifest() {
	try {
		const data = fs.readFileSync('./origami.json', 'utf8');
		return JSON.parse(data);
	} catch (error) {
		throw new Error(`Could not parse the component's origami.json. Are you running in a component directory?\n${error.message}`);
	}
}

/**
 * Get the brands the component currently supports.
 * Gets brands locally rather than through repoData as brand support may
 * have changed since the last release.
 * @return {array<string>} - The brands the component currently supports.
 */
function getBrands() {
	const origami = getOrigamiManifest();
	const brands = origami.brands || [];
	if (!Array.isArray(brands)) {
		throw new TypeError(`The components origami.json "brands" paramter should be an array. ${brands}`);
	}
	return brands;
}

/**
 * @return {string} - The the current git commit for the current component directory.
 */
async function getCurrentCommit() {
	try {
		const { stdout } = await execa.command('git rev-parse HEAD');
		return stdout;
	} catch (error) {
		throw new TypeError('Could not find the latest component commit.');
	}
}

/**
 * Latest patch or minor release for the component in the current directory.
 * @return {string} - version
 */
async function getLatestRelease() {
	try {
		const { stdout } = await execa.command('git tag');
		const tags = stdout
			.split('\n')
			.map(t => semver.valid(t))
			.filter(t => t) // filter null
			.filter(t => !semver.prerelease(t)) // filter prereleases
			.sort((a, b) => { // sort by most recent
				if (semver.lt(a, b)) {
					return 1;
				}
				if (semver.gt(a, b)) {
					return -1;
				}
				return 0;
			});
		return tags[0];
	} catch (error) {
		throw new Error('couldn\'t get the latest release ' + error.message);
	}
}

module.exports = class Version {
	constructor(name, ref, brands) {
		this.name = name;
		this.ref = ref;
		this.brands = brands;
	}

	static async create(name, ref) {
		if (!semver.valid(ref)) {
			throw new Error(`${ref} is not a valid semver version.`);
		}

		try {
			const brands = (await repoData.getManifest(name, ref, 'origami')).brands || [];
			return new Version(name, ref, brands);
		} catch (error) {
			throw new Error(`Could not get manifest files for version ${ref} of ${name} from Origami Repo Data. ${error.message}`);
		}
	}

	static async createFromLocalDirectory(ref) {
		const isSemver = semver.valid(ref);
		if (!isSemver && ref !== 'release' && ref !== 'commit') {
			throw new Error('The version must be a valid semver tag, "release", or "commit".');
		}
		// v1.0.0 to 1.0.0
		if (isSemver) {
			ref = semver.valid(ref);
		}
		let name;
		try {
			// Find version locally if not a semver.
			if (ref === 'release') {
				ref = await getLatestRelease();
			}
			if (ref === 'commit') {
				ref = await getCurrentCommit();
			}
			// Find name locally.
			name = getName();
		} catch (error) {
			throw new Error(`Could not get component details locally:\n${error.message}\nAre you not running in a component directory, or missing arguments?`);
		}

		// If it's a semver version we can't get the brands locally.
		// Whilst the names don't change, the component's brand support may.
		let brands;
		if (isSemver) {
			try {
				brands = (await repoData.getManifest(name, ref, 'origami')).brands || [];
			} catch (error) {
				throw new Error(`Could not get manifest files for version ${ref} of ${name}. ${error.message}`);
			}
		} else {
			brands = getBrands();
		}

		return new Version(name, ref, brands);
	}
};
