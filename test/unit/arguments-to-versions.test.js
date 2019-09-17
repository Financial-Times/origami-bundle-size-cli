'use strict';

const sinon = require('sinon');
const proclaim = require('proclaim');
const getVersions = require('../../src/arguments-to-versions');
const Version = require('../../src/version');

describe('arguments-to-components', () => {
	const commit = new Version('test', 'commit', []);
	const release = new Version('test', 'release', []);

	const tag = 'v3.0.0';
	const semver = new Version('test', tag, []);

	let versionStub;
	let localVersionStub;

	beforeEach(() => {
		localVersionStub = sinon.stub(Version, 'createFromLocalDirectory');
		localVersionStub.withArgs('release').returns(release);
		localVersionStub.withArgs('commit').returns(commit);
		localVersionStub.withArgs(tag).returns(semver);

		versionStub = sinon.stub(Version, 'create');
	});

	afterEach(() => {
		versionStub.restore();
		localVersionStub.restore();
	});

	describe('given two arguments', () => {
		it('errors', async () => {
			let hasError;
			try {
				await getVersions(['v1.0.0', 'v2.0.0']);
			} catch (error) {
				hasError = error;
			}
			if (!hasError) {
				throw new Error('Did not error.');
			}
		});
	});

	describe('given no arguments', () => {
		it('gets a "component" for the latest release and commit to compare locally', async () => {
			const versions = await getVersions([]);
			proclaim.equal(versions.from, release);
			proclaim.equal(versions.to, commit);
		});
	});

	describe('given one semver argument', () => {
		it('gets a "component" for the given semver and the latest commit to compare locally', async () => {
			const versions = await getVersions([tag]);
			proclaim.equal(versions.from, semver);
			proclaim.equal(versions.to, commit);
		});
	});

	describe('given a component name and two semver arguments', () => {
		it('gets "component"s for given name and semvers to compare remotely (via origami-repo-data)', async () => {
			const name = 'o-example';
			// semver a
			const taga = 'v1.0.0';
			const a = new Version(name, taga, []);
			// semver b
			const tagb = 'v4.0.0';
			const b = new Version(name, tagb, []);

			versionStub.withArgs(name, taga).returns(a);
			versionStub.withArgs(name, tagb).returns(b);

			const versions = await getVersions([name, taga, tagb]);
			proclaim.equal(versions.from, a);
			proclaim.equal(versions.to, b);
		});
	});

});
