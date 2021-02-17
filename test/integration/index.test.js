'use strict';

const nixt = require('nixt');

describe('origami-bundle-size-cli', function() {
	this.timeout(20000);

	it('exits with an error with no arguments', (done) => {
		nixt({ colors: false })
			.run('./bin/run')
			.stderr(' ›   Error: Incorrect number of arguments, see "origami-bundle-size --help"')
			.end(done);
	});

	it('error with only two version arguments, as a component name is required', (done) => {
		nixt({ colors: false })
			.run('./bin/run v1.0.0 v1.0.1')
			.stderr(' ›   Error: Incorrect number of arguments, see "origami-bundle-size --help"')
			.end(done);
	});

	it('finds bundle size difference given a component name and two versions', (done) => {
		nixt({ colors: false })
			.run('./bin/run o-test-component v1.0.33 v1.0.34')
			.stdout(`o-test-component bundle size difference from v1.0.33 to v1.0.34
No bundle size differences found.`)
			.end(done);
	});
});
