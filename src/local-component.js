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
	let bower;
	try {
		const data = fs.readFileSync('./bower.json', 'utf8');
		bower = JSON.parse(data);
	} catch (error) {
		throw new TypeError('Could not parse the component\'s bower.json.');
	}
	return bower;
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
	let origami;
	try {
		const data = fs.readFileSync('./origami.json', 'utf8');
		origami = JSON.parse(data);
	} catch (error) {
		throw new Error(`Could not parse the component's origami.json. Are you running in a component directory?\n${error.message}`);
	}
	return origami;
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
	let commit;
	try {
		const { stdout } = await execa.command('git rev-parse HEAD');
		commit = stdout;
	} catch (error) {
		throw new TypeError('Could not find the latest component commit.');
	}
	return commit;
}

/**
 * Latest patch or minor release for the component in the current directory.
 * @return {string} - version
 */
async function getLatestRelease() {
	let tag;
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
		tag = tags[0];
	} catch (error) {
		throw new Error('couldn\'t get the latest release ' + error.message);
	}
	return tag;
}

module.exports = class LocalVersion {
	constructor(name, version, brands) {
		this.name = name;
		this.version = version;
		this.brands = brands;
	}

	static async create(version) {
		const isSemver = semver.valid(version);
		if (!isSemver && version !== 'release' && version !== 'commit') {
			throw new Error('The version must be a valid semver tag, "release", or "commit".');
		}
		let name;
		try {
			// Find version locally if not a semver.
			if (version === 'release') {
				version = await getLatestRelease();
			}
			if (version === 'commit') {
				version = await getCurrentCommit();
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
				brands = (await repoData.getManifest(name, version, 'origami')).brands || [];
			} catch (error) {
				throw new Error(`Could not get manifest files for version ${version} of ${name}. ${error.message}`);
			}
		} else {
			brands = getBrands();
		}

		return new LocalVersion(name, version, brands);
	}
};
