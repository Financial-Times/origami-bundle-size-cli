'use strict';

const sinon = require('sinon');
const proclaim = require('proclaim');
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
	let getBundleSize;

	beforeEach(() => {
		getBundleSize = require('../../src/bundle-size');
		// Mock repo data.
		// Repo data does not return a language property in its bundle data.
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
	});

	describe('given a non-semver version', () => {
		it('throws an error', async () => {
			try {
				await getBundleSize(nonSemverVersion);
			} catch (error) {
				return proclaim.isInstanceOf(error, TypeError);
			}
			proclaim.ok(false, 'No error thrown.');
		});
	});
});
