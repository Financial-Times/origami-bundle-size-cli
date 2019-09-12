const getBundleInfo = require('../../src/build-service-bundle-size');
const proclaim = require('proclaim');

describe('build-service-bundle-size', () => {
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
			const bundles = await getBundleInfo('o-test-component', 'v1.0.30', data.language, data.brands || []);
			proclaim.deepEqual(bundles, data.expected);
		});
	}
});
