'use strict';

const proclaim = require('proclaim');
const getMessage = require('../../src/get-message');

describe('get-message', () => {

	const bundlesA = [{
		language: 'css',
		brand: 'master',
		sizes: { raw: '10000', gzip: '1000' }
	}, {
		language: 'css',
		brand: 'internal',
		sizes: { raw: '80', gzip: '500' }
	}, {
		language: 'js',
		brand: 'master',
		sizes: { raw: '10000', gzip: '1000' }
	}];

	const bundlesB = [{
		language: 'css',
		brand: 'master',
		sizes: { raw: '20000', gzip: '2000' }
	}, {
		language: 'css',
		brand: 'internal',
		sizes: { raw: '10000', gzip: '1000' }
	}, {
		language: 'js',
		brand: 'master',
		sizes: { raw: '20000', gzip: '2000' }
	}];

	it('shows the bundle size difference for bundles which are larger', () => {
		const message = getMessage(bundlesA, bundlesB);
		proclaim.equal(message, 'css, master: 9.77kb increase (0.98kb/gzip)\ncss, internal: 9.69kb increase (0.49kb/gzip)\njs, master: 9.77kb increase (0.98kb/gzip)');
	});

	it('shows the bundle size difference for bundles which are smaller', () => {
		const message = getMessage(bundlesB, bundlesA);
		proclaim.equal(message, 'css, master: 9.77kb decrease (-0.98kb/gzip)\ncss, internal: 9.69kb decrease (-0.49kb/gzip)\njs, master: 9.77kb decrease (-0.98kb/gzip)');
	});

});
