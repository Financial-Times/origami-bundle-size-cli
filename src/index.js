const {Command} = require('@oclif/command');
const fs = require('fs');
const execa = require('execa');
const semver = require('semver');
const fetchBundleSize = require('./bundle-size');

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

function getSizeDiff(current, previous) {
	return ((current - previous) / 1024).toFixed(2);
}

function getMessage(current, previous, language, brand) {
	const gzipDiff = getSizeDiff(current.sizes.gzip, previous.sizes.gzip);
	const rawDiff = getSizeDiff(current.sizes.raw, previous.sizes.raw);
	if (Math.abs(rawDiff) < 0.1) { // 0.1kb
		return `${language}${brand ? `(${brand})` : ''}: No significant size change.`;
	}

	return `${language}${brand ? `(${brand})` : ''}: ${Math.abs(rawDiff)}kb ${rawDiff < 0 ? 'decrease' : 'increase'} (${Math.abs(gzipDiff)}kb ${gzipDiff < 0 ? 'decrease' : 'increase'} with gzip).`;
}

class OrigamiBundleSizeCliCommand extends Command {
	async run() {
		const { argv } = this.parse(OrigamiBundleSizeCliCommand);
		let name;
		let from;
		let to;

		// If no arguments were given find both versions to compare. E.g:
		// > origami-bundle-size
		// from: the last release of the same major (not a pre release)
		// to: the latest commit (HEAD)
		if (argv.length === 0) {
			try {
				name = getName();
				from = await getLatestRelease();
				to = await getCurrentCommit();
			} catch (error) {
				return this.error(`${error.message}\nAre you running in a component directory?`);
			}
		}

		// If one argument is given take that as the to version, and find the from
		// version to compare. E.g:
		// > origami-bundle-size v1.0.0
		// from: v1.0.0
		// to: the latest commit (HEAD)
		if (argv.length === 1) {
			name = getName();
			from = argv[0];
			to = await getCurrentCommit();
			if (!semver.valid(from)) {
				return this.error(`${from} is not a valid version.`);
			}
		}

		// Do not expect only two arguments
		if (argv.length === 2) {
			return this.error('Incorrect number of arguments, see "origami-bundle-size --help"');
		}

		// If three arguments are given, we have been given the name, to, and from
		// versions specifically. E.g:
		// > origami-bundle-size o-table v7.0.0 v7.4.0
		if (argv.length === 3) {
			name = argv[0];
			from = argv[1];
			to = argv[2];
			if (!semver.valid(from)) {
				return this.error(`${from} is not a valid version.`);
			}

			if (!semver.valid(to)) {
				return this.error(`${to} is not a valid version.`);
			}
		}

		try {
			await repoData.getRepo(name);
		} catch (error) {
			if (error.status === 404) {
				return this.error(`Could not find the component "${name}" in Origami Repo Data.`);
			}
		}

		// "from" may not be the current commit
		// is must be a valid tag
		if (!semver.valid(from)) {
			throw new TypeError(`${from} is not a valid semver range.`);
		}

		// get brands
		const brands = {
			to: null,
			from: null,
		};

		// "to" manifests, it may be the current commit
		if (semver.valid(to)) {
			try {
				brands.to = (await repoData.getManifest(name, to, 'origami')).brands || [];
			} catch (error) {
				return this.error(`Could not get manifest files for version ${to} of this component. ${error.message}`);
			}
		} else {
			brands.to = getBrands();
		}

		try {
			// "from" manifests, it can only be a valid tag
			brands.from = (await repoData.getManifest(name, from, 'origami')).brands || [];
		} catch (error) {
			return this.error(`Could not get manifest files for version ${from} of this component. ${error.message}`);
		}

		this.log(`${name} diff from ${from} to ${to}`);

		const toBundles = await fetchBundleSize(name, to, brands.to);
		const fromBundles = await fetchBundleSize(name, from, brands.from);

		toBundles.css.forEach(current => {
			const brand = current.brand;
			const previous = toBundles.css.find(previous => previous.brand === current.brand);
			if (previous) {
				this.log(getMessage(current, previous, 'css', brand));
			}
		});

		fromBundles.js.forEach(current => {
			const brand = current.brand;
			const previous = fromBundles.js.find(previous => previous.brand === current.brand);
			if (previous) {
				this.log(getMessage(current, previous, 'js', brand));
			}
		});
	}
}

OrigamiBundleSizeCliCommand.description = `Find the difference in JS and CSS bundle size between component versions.
...

Run within a component directory to compare the bundle sizes of HEAD against the
latest release of the same major (HEAD must be pushed to Github).
> origami-bundle-size

Or provide a verison to compare against HEAD.
> origami-bundle-size v1.0.0

Or compare the bundle size of any two published versions of a given Origami
component.
> origami-bundle-size o-table v1.0.0 v2.0.0
`;

OrigamiBundleSizeCliCommand.strict = false;

module.exports = OrigamiBundleSizeCliCommand;
