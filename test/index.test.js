const { test } = require('@oclif/test');
const cmd = require('..');

describe('origami-bundle-size-cli', () => {

	beforeEach(() => {
		process.env.REPO_DATA_API_KEY = 'mock-repo-data-api-key';
		process.env.REPO_DATA_API_SECRET = 'mock-repo-data-api-secret';
	});

	// Errors with no arguments when not running in a component directory.
	test
		.stderr()
		.do(() => cmd.run([]))
		.exit(2)
		.it('exits with an error with no arguments and not in a component directory');

	// Error with only two version arguments, as a component name is required.
	test
		.stderr()
		.do(() => cmd.run(['v1.0.0', 'v1.0.1']))
		.exit(2)
		.it('exits with an error with only two arguments');
});
