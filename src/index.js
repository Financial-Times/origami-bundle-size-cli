'use strict';

const {Command} = require('@oclif/command');
const fetchBundleSize = require('./bundle-size');
const getVersions = require('./arguments-to-versions');
const getMessage = require('./get-message');

class OrigamiBundleSizeCliCommand extends Command {
	async run() {
		// Confirm required enviroment variables.
		if (!process.env.REPO_DATA_API_KEY || !process.env.REPO_DATA_API_SECRET) {
			this.error('Please provide credentials for [Origami Repo Data](https://origami-repo-data.ft.com/) with the enviroment variables `REPO_DATA_API_KEY` and `REPO_DATA_API_SECRET`.');
		}

		// Get arguments.
		const { argv } = this.parse(OrigamiBundleSizeCliCommand);

		// Find component versions for comparison e.g. ("from" v1.0.0 "to" v2.0.0).
		let components;
		try {
			components = await getVersions(argv);
		} catch (error) {
			this.error(error.message);
		}

		const to = components.to;
		const from = components.from;

		// Get bundle information for both component versions.
		let toBundles;
		let fromBundles;
		try {
			this.log(`${to.name} bundle size difference from ${from.ref} to ${to.ref}`);
			toBundles = await fetchBundleSize(to);
			fromBundles = await fetchBundleSize(from);
		} catch (error) {
			this.error(`Could notget bundle sizes: ${error.message}`);
		}

		// Log message for CSS bundle size diff.
		try {
			this.log(getMessage(fromBundles, toBundles));
		} catch (error) {
			this.error(`Could not generate a message from the component bundles: ${error.message}`);
		}
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
