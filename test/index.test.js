'use strict';

const cmd = require('..');
const proclaim = require('proclaim');
const { stdout } = require('stdout-stderr');

describe('origami-bundle-size-cli', () => {

	it('exits with an error with no arguments and not in a component directory', async () => {
		let errorMessage;
		try {
			await cmd.run([]);
		} catch (error) {
			errorMessage = error.message;
		}

		proclaim.include(errorMessage, 'Could not get component details locally');
	});

	it('error with only two version arguments, as a component name is required', async () => {
		let errorMessage = '';
		try {
			await cmd.run(['v1.0.0', 'v1.0.1']);
		} catch (error) {
			errorMessage = error.message;
		}

		proclaim.include(errorMessage, 'Incorrect number of arguments');
	});

	it('finds bundle size difference given a component name and two versions', async () => {
		// start mocking stdout
		stdout.start();
		//  run the command
		await cmd.run(['o-test-component', 'v1.0.33', 'v1.0.34']);
		// stop mocking stdout
		stdout.stop();
		// confirm the message we expect was output
		proclaim.include(stdout.output, 'No bundle size difference found');
	});
});
