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

	it('contains the bundle size difference for bundles which are larger', () => {
		const message = getMessage(bundlesA, bundlesB);
		proclaim.equal(message, 'css, master: 9.77kb increase (0.98kb/gzip)\ncss, internal: 9.69kb increase (0.49kb/gzip)\njs, master: 9.77kb increase (0.98kb/gzip)');
	});

	it('contains the bundle size difference for bundles which are smaller', () => {
		const message = getMessage(bundlesB, bundlesA);
		proclaim.equal(message, 'css, master: 9.77kb decrease (-0.98kb/gzip)\ncss, internal: 9.69kb decrease (-0.49kb/gzip)\njs, master: 9.77kb decrease (-0.98kb/gzip)');
	});

	it('contains a simple message when all bundle sizes are equal', () => {
		const message = getMessage(bundlesA, bundlesA);
		proclaim.equal(message, 'No bundle size differences found.');
	});

	it('contains a simple message when all bundles are insignificantly different', () => {
		// increase bundle size insignificant
		const similarBundles = bundlesA.map(b => {
			const clone = JSON.parse(JSON.stringify(b));
			clone.sizes.raw = (new Number(clone.sizes.raw) + 200).toString();
			return clone;
		});
		const message = getMessage(bundlesA, similarBundles);
		proclaim.equal(message, 'No significant bundle size differences found.');
	});

	it('contains the bundle size difference for any significantly difference and a brief not of insignificantly differences', () => {
		// increase bundle size insignificant
		const similarBundles = bundlesA.map(b => {
			const clone = JSON.parse(JSON.stringify(b));
			clone.sizes.raw = (new Number(clone.sizes.raw) + 200).toString();
			return clone;
		});
		// increase first bundle by a not-insignificant amount
		similarBundles[0].sizes.raw = (new Number(similarBundles[0].sizes.raw) + 500).toString();
		// confirm message
		const message = getMessage(bundlesA, similarBundles);
		proclaim.equal(message, 'css, master: 0.68kb increase (0.00kb/gzip)\nAn insignificant difference was found for: css (internal), js (master)');
	});

});
