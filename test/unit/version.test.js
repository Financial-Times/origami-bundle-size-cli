const sinon = require('sinon');
const proclaim = require('proclaim');
const Version = require('../../src/version');
const RepoDataClient = require('@financial-times/origami-repo-data-client');
const execa = require('execa');
const fs = require('fs');
const semver = require('semver');

describe('version', () => {

	let repoDataStub;
	let execaCommandStub;
	let fsReadStub;

	const mockTags = 'v7.1.0\nv7.2.0\naaa\nzzz\n111\n999\n7.2.1\nv7.2.2\nv7.3.0-beta.1\nv7.3.0-beta.2';
	const mockLatestNonPreReleaseTag = 'v7.2.2';
	const commitRef = 'ce013625030ba8dba906f756967f9e9ca394464a';

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
		repoDataStub = sinon.stub(RepoDataClient.prototype, 'getManifest').returns(mockOrigmaiManifest);
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

	describe('createFromLocalDirectory', () => {

		it('errors if given a ref which isn\'t "release", "commit", or a valid semver', async () => {
			let didError;
			try {
				for await (const ref of ['somestring', commitRef, 'v1.5.5.5']) {
					await Version.createFromLocalDirectory(ref);
				}
			} catch (error) {
				didError = true;
			}
			proclaim.isTrue(didError);
		});

		it('returns a Version for the latest commit in the current directory if given "commit" as a ref', async () => {
			const version = await Version.createFromLocalDirectory('commit');
			proclaim.equal(version.ref, commitRef);
		});

		it('returns a Version for the latest semver tag in the current directory if given "release" as a ref', async () => {
			const version = await Version.createFromLocalDirectory('release');
			proclaim.equal(version.ref, semver.valid(mockLatestNonPreReleaseTag));
		});

		it('returns a Version for the semver tag given if given a semver as a ref', async () => {
			const version = await Version.createFromLocalDirectory('v4.4.4');
			proclaim.equal(version.ref, semver.valid('v4.4.4'));
		});

		it('returns a Version with a name found from origami.json in the current directory ', async () => {
			const version = await Version.createFromLocalDirectory('v4.4.4');
			proclaim.equal(version.name, mockBowerManifest.name);
		});

		it('returns a Version with brands found in the current directory if not given a semver ref', async () => {
			const version = await Version.createFromLocalDirectory('commit');
			const brands = version.brands;
			proclaim.isTrue(repoDataStub.notCalled);
			proclaim.isTrue(fsReadStub.called);
			proclaim.deepEqual(brands, mockOrigmaiManifest.brands);
		});

		it('returns a Version with brands from origami repo data if given a semver ref', async () => {
			const version = await Version.createFromLocalDirectory('v1.1.1');
			const brands = version.brands;
			proclaim.isTrue(repoDataStub.called);
			proclaim.deepEqual(brands, mockOrigmaiManifest.brands);
		});
	});
});
