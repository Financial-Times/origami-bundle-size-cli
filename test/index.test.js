const {test} = require('@oclif/test');
const cmd = require('..');

describe('origami-bundle-size-cli', () => {
	// Errors with no arguments when not running in a component directory.
	test
		.do(() => cmd.run([]))
		.exit(2);

	// Error with only two version arguments, as a component name is required.
	test
		.do(() => cmd.run([['v1.0.0', 'v1.0.1']]))
		.exit(2);
});
