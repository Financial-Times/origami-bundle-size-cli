'use strict';

const semver = require('semver');
const RepoDataClient = require('@financial-times/origami-repo-data-client');
const repoData = new RepoDataClient();

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
			const brands = (await repoData.getVersion(name, ref).brands) || [];
			return new Version(name, ref, brands);
		} catch (error) {
			throw new Error(`Could not get brands for version ${ref} of ${name} from Origami Repo Data. ${error.message}`);
		}
	}
};
