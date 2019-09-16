'use strict';

const { test, expect } = require('@oclif/test');
const cmd = require('..');

describe('origami-bundle-size-cli', () => {
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

	// Finds bundle size difference given a component name and two versions.
	test
		.stdout()
		.do(() => cmd.run(['o-test-component', 'v1.0.33', 'v1.0.34']))
		.it('shows the bundle size difference given a component name and two versions', ctx => {
			expect(ctx.stdout).to.contain('No bundle size difference found');
		});
});
