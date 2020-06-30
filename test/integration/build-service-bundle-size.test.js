'use strict';

const getBundleInfo = require('../../src/build-service-bundle-size');
const proclaim = require('proclaim');

describe('build-service-bundle-size', function () {
	this.timeout(20000);

	const testData = [
		{
			language: 'js',
			expected: [{
				language: 'js',
				brand: null,
				sizes: { raw: '1535', gzip: '670' },
				url: 'https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%40v1.0.30'
			}]
		},
		{
			language: 'js',
			brands: ['internal'], // js has no brands, so we do not expect a brand in the url
			expected: [{
				language: 'js',
				brand: null,
				sizes: { raw: '1535', gzip: '670' },
				url: 'https://www.ft.com/__origami/service/build/v2/bundles/js?modules=o-test-component%40v1.0.30'
			}]
		},
		{
			language: 'css',
			brands: ['internal'],
			expected: [{
				language: 'css',
				brand: 'internal',
				sizes: { raw: '177', gzip: '160' },
				url: 'https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%40v1.0.30&brand=internal'
			}]
		},
		{
			language: 'css',
			brands: ['master', 'internal'],
			expected: [{
				language: 'css',
				brand: 'master',
				sizes: { raw: '175', gzip: '158' },
				url: 'https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%40v1.0.30&brand=master'
			},
			{
				language: 'css',
				brand: 'internal',
				sizes: { raw: '177', gzip: '160' },
				url: 'https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%40v1.0.30&brand=internal'
			}]
		},
		{
			language: 'css',
			expected: [{
				language: 'css',
				brand: null,
				sizes: { raw: '175', gzip: '158' },
				url: 'https://www.ft.com/__origami/service/build/v2/bundles/css?modules=o-test-component%40v1.0.30'
			}]
		}
	];

	for (const data of testData) {
		it(`gets bundle information for ${data.language}${data.brands ? ` of brands ${data.brands.join(',')}` : ''} `, async () => {
			// We can't reliably do a deep equal as the bundle sizes from
			// the Origami Build Service may vary slightly over time. Instead
			// find a matching bundle based on url and check properties
			// individually. Allow a tolerance of 10% in the sizes assertion.
			const bundles = await getBundleInfo('o-test-component', 'v1.0.30', data.language, data.brands || []);
			const expectedBundles = data.expected;
			// Confirm bundle count.
			proclaim.equal(
				bundles.length,
				expectedBundles.length,
				`Returned ${bundles.length} bundles but was expecting ` +
				`${expectedBundles.length}.`
			);
			for (const bundle of bundles) {
				// Confirm bundle urls.
				const expectedBundle = expectedBundles.find(
					b => b.url === bundle.url
				);
				proclaim.ok(
					expectedBundle,
					`A bundle with url ${bundle.url} was not expected.`
				);

				// Compare the sizes of the bundle. We want to allow a tolerance
				// when comparing these as the value may change slightly over
				// time.
				for (const key in bundle.sizes) {
					if (bundle.sizes.hasOwnProperty(key)) {
						const tolerance = 0.1; // 10%
						const sizeValue = bundle.sizes[key];
						const expectedSizeValue = expectedBundle.sizes[key];
						const expectedMax = expectedSizeValue * (1 + tolerance);
						const expectedMin = expectedSizeValue * (1 - tolerance);
						const message = `The ${key} bundle should have a size ` +
							`around "${expectedSizeValue}" but found "${sizeValue}".`;
						proclaim.lessThanOrEqual(sizeValue, expectedMax, message);
						proclaim.greaterThanOrEqual(sizeValue, expectedMin, message);
					}
				}

				// Remove the bundle sizes, which have already been tested
				// with a tolerance. And test the other bundle properties
				// equal.
				delete bundle.sizes;
				delete expectedBundle.sizes;
				proclaim.deepEqual(
					bundle,
					expectedBundle,
					`A bundle with url ${bundle.url} did not have the ` +
					'expected properties.'
				);
			}
		});
	}
});
