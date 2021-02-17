'use strict';

const sinon = require('sinon');
const proclaim = require('proclaim');
const Version = require('../../src/version');
const RepoDataClient = require('@financial-times/origami-repo-data-client');
const execa = require('execa');
const fs = require('fs');

describe('version', () => {

	let repoDataStub;
	let execaCommandStub;
	let fsReadStub;

	const mockTags = 'v7.1.0\nv7.2.0\naaa\nzzz\n111\n999\n7.2.1\nv7.2.2\nv7.3.0-beta.1\nv7.3.0-beta.2';
	const commitRef = 'ce013625030ba8dba906f756967f9e9ca394464a';

	const mockRepoDataVersion = {
		name: 'example',
		brands: [
			'master',
			'internal'
		]
	};

	const mockOrigmaiManifest = {
		name: 'example',
		brands: [
			'master',
			'internal'
		]
	};

	const mockBowerManifest = {
		name: 'o-example',
		main: [
			'main.js'
		]
	};

	beforeEach(() => {
		// Stub repo data.
		repoDataStub = sinon.stub(RepoDataClient.prototype, 'getVersion').returns(mockRepoDataVersion);
		// Stub execa.
		execaCommandStub = sinon.stub(execa, 'command');
		execaCommandStub.withArgs('git rev-parse HEAD').returns({
			stdout: commitRef
		});
		execaCommandStub.withArgs('git tag').returns({
			stdout: mockTags
		});
		// Stub fs.
		fsReadStub = sinon.stub(fs, 'readFileSync');
		fsReadStub.withArgs('./bower.json', sinon.match.any).returns(JSON.stringify(mockBowerManifest));
		fsReadStub.withArgs('./origami.json', sinon.match.any).returns(JSON.stringify(mockOrigmaiManifest));
	});

	afterEach(() => {
		// Restore stubs.
		repoDataStub.restore();
		execaCommandStub.restore();
		fsReadStub.restore();
	});

	describe('create', () => {

		it('returns a Version with brands from origami repo data', async () => {
			const version = await Version.create('o-example', 'v1.0.0');
			proclaim.deepEqual(version.brands, mockOrigmaiManifest.brands);
		});

		it('errors if given a ref which isn\'t valid semver', async () => {
			let didError;
			try {
				await Version.create('o-example', commitRef);
			} catch (error) {
				didError = true;
			}
			proclaim.isTrue(didError);
		});
	});
});
