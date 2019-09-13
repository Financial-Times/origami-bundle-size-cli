const sinon = require('sinon');
const proclaim = require('proclaim');
const getComponents = require('../../src/arguments-to-components');
const Version = require('../../src/version');

describe('arguments-to-components', () => {

	describe('given two arguments', () => {
		it('errors', async () => {
			let hasError;
			try {
				await getComponents(['v1.0.0', 'v2.0.0']);
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
			const commit = new Version('test', 'commit', []);
			const release = new Version('test', 'release', []);

			const localComponentStub = sinon.stub(Version, 'createFromLocalDirectory');
			localComponentStub.withArgs('release').returns(release);
			localComponentStub.withArgs('commit').returns(commit);

			const components = await getComponents([]);
			proclaim.equal(components.from, release);
			proclaim.equal(components.to, commit);

			localComponentStub.restore();
		});
	});

	describe('given one semver argument', () => {
		it('gets a "component" for the given semver and the latest commit to compare locally', async () => {
			const tag = 'v3.0.0';
			const commit = new Version('test', 'commit', []);
			const semver = new Version('test', tag, []);

			const localComponentStub = sinon.stub(Version, 'createFromLocalDirectory');
			localComponentStub.withArgs(tag).returns(semver);
			localComponentStub.withArgs('commit').returns(commit);

			const components = await getComponents([tag]);
			proclaim.equal(components.from, semver);
			proclaim.equal(components.to, commit);

			localComponentStub.restore();
		});
	});

	describe('given a component name and two semver arguments', () => {
		it('gets "component"s for given name and semvers to compare remotely (via origami-repo-data)', async () => {
			const name = 'o-example';
			const taga = 'v1.0.0';
			const tagb = 'v3.0.0';
			const a = new Version(name, taga, []);
			const b = new Version(name, tagb, []);

			const remoteComponentStub = sinon.stub(Version, 'create');
			remoteComponentStub.withArgs(name, taga).returns(a);
			remoteComponentStub.withArgs(name, tagb).returns(b);

			const components = await getComponents([name, taga, tagb]);
			proclaim.equal(components.from, a);
			proclaim.equal(components.to, b);

			remoteComponentStub.restore();
		});
	});

});
