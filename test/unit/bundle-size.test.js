'use strict';

const sinon = require('sinon');
const proclaim = require('proclaim');
const proxyquire = require('proxyquire');
const RepoDataClient = require('@financial-times/origami-repo-data-client');
const Version = require('../../src/version');

describe('bundle-size', () => {
	const name = 'o-example';
	const brands = ['master', 'internal'];

	const version = new Version(
		name,
		'v1.0.0',
		brands
	);

	const nonSemverVersion = new Version(
		name,
		'ce013625030ba8dba906f756967f9e9ca394464a',
		brands
	);

	const mockCssBundles = [{
		language: 'css',
		brand: 'master'
	}, {
		language: 'css',
		brand: 'internal'
	}];

	const mockJsBundles = [{
		language: 'js'
	}];

	let repoDataStub;
	let buildServiceSizeStub;
	let getBundleSize;

	beforeEach(() => {
		// Mock `build-service-bundle-size` required by `bundle-size`,
		// the function under test.
		buildServiceSizeStub = sinon.stub();
		buildServiceSizeStub.withArgs(name, sinon.match.any, 'css').returns(mockCssBundles);
		buildServiceSizeStub.withArgs(name, sinon.match.any, 'js').returns(mockJsBundles);
		getBundleSize = proxyquire('../../src/bundle-size', {
			'./build-service-bundle-size': buildServiceSizeStub
		});
		// Repo data does not return a language property in its bundle data.
		// Mock repo data.
		repoDataStub = sinon.stub(RepoDataClient.prototype, 'listBundles');
		repoDataStub.withArgs(name, sinon.match.any, 'css').returns(mockCssBundles.map(b => {
			delete b.language;
			return b;
		}));
		repoDataStub.withArgs(name, sinon.match.any, 'js').returns(mockJsBundles.map(b => {
			delete b.language;
			return b;
		}));
	});

	afterEach(() => {
		// Restore repo data stubs.
		repoDataStub.restore();
	});

	describe('given a valid semver version', () => {
		it('fetches bundle information from repo data', async () => {
			const bundles = await getBundleSize(version);
			proclaim.isTrue(repoDataStub.called);
			proclaim.deepEqual(bundles, [...mockJsBundles, ...mockCssBundles]);
		});

		it('does not generate bundle information from the build service if repo data succeeds', async () => {
			const bundles = await getBundleSize(version);
			proclaim.isTrue(buildServiceSizeStub.notCalled);
			proclaim.deepEqual(bundles, [...mockJsBundles, ...mockCssBundles]);
		});

		it('generates bundle information from the build service if repo data fails', async () => {
			// Update repo data mock to fail. This may happen if repo data is
			// down, or can't find the semver version.
			repoDataStub.restore();
			repoDataStub = sinon.stub(RepoDataClient.prototype, 'listBundles');
			repoDataStub.throwsException(new Error());
			// Create bundle.
			const bundles = await getBundleSize(version);
			// Assert the build service was used to generate bundle information instead.
			proclaim.isTrue(buildServiceSizeStub.called);
			proclaim.deepEqual(bundles, [...mockJsBundles, ...mockCssBundles]);
		});
	});

	describe('given a non-semver version', () => {
		it('does not fetch bundle information from repo data', async () => {
			const bundles = await getBundleSize(nonSemverVersion);
			proclaim.isTrue(repoDataStub.notCalled);
			proclaim.deepEqual(bundles, [...mockJsBundles, ...mockCssBundles]);
		});

		it('generates bundle information from the build service', async () => {
			const bundles = await getBundleSize(nonSemverVersion);
			proclaim.isTrue(buildServiceSizeStub.called);
			proclaim.deepEqual(bundles, [...mockJsBundles, ...mockCssBundles]);
		});
	});
});
