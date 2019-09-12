const semver = require('semver');
const RepoDataClient = require('@financial-times/origami-repo-data-client');
const repoData = new RepoDataClient({
	apiKey: process.env.REPO_DATA_API_KEY,
	apiSecret: process.env.REPO_DATA_API_SECRET
});

module.exports = class SemverVersion {
	constructor(name, version, brands) {
		if (!semver.valid(version)) {
			throw new Error(`${version} is not a valid semver version.`);
		}
		this.name = name;
		this.version = version;
		this.brands = brands;
	}

	static async create(name, version) {
		try {
			const brands = (await repoData.getManifest(name, version, 'origami')).brands || [];
			return new SemverVersion(name, version, brands);
		} catch (error) {
			throw new Error(`Could not get manifest files for version ${version} of ${name} from Origami Repo Data. ${error.message}`);
		}
	}
};
