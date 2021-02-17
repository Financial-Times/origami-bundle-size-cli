'use strict';

const {Command} = require('@oclif/command');
const fetchBundleSize = require('./bundle-size');
const getMessage = require('./get-message');
const Version = require('./version');

class OrigamiBundleSizeCliCommand extends Command {
	async run() {
		// Get arguments.
		const { argv } = this.parse(OrigamiBundleSizeCliCommand);
		if (argv.length !== 3) {
			this.error('Incorrect number of arguments, see "origami-bundle-size --help"');
		}

		// Find component versions for comparison e.g. ("from" v1.0.0 "to" v2.0.0).
		let to;
		let from;
		try {
			from = await Version.create(argv[0], argv[1]);
			to = await Version.create(argv[0], argv[2]);
		} catch (error) {
			this.error(error.message);
		}

		// Get bundle information for both component versions.
		let toBundles;
		let fromBundles;
		try {
			this.log(`${to.name} bundle size difference from ${from.ref} to ${to.ref}`);
			toBundles = await fetchBundleSize(to);
			fromBundles = await fetchBundleSize(from);
		} catch (error) {
			this.error(`Could not get bundle sizes: ${error.message}`);
		}

		// Log message for CSS bundle size diff.
		try {
			this.log(getMessage(fromBundles, toBundles));
		} catch (error) {
			this.error(`Could not generate a message from the component bundles: ${error.message}`);
		}
	}
}

OrigamiBundleSizeCliCommand.description = `Find the difference in JS and CSS bundle size between two released component versions.
...
E.g.
> origami-bundle-size o-table v5.0.0 v7.4.0
`;

OrigamiBundleSizeCliCommand.strict = false;

module.exports = OrigamiBundleSizeCliCommand;
