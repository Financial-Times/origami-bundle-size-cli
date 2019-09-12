const LocalComponent = require('./local-component');
const RemoteComponent = require('./remote-component');

module.exports = async argv => {
	let from;
	let to;

	// If no arguments were given find both versions to compare. E.g:
	// > origami-bundle-size
	// from: the last release of the same major (not a pre release)
	// to: the latest commit (HEAD)
	if (argv.length === 0) {
		from = await LocalComponent.create('release');
		to = await LocalComponent.create('commit');
	}

	// If one argument is given take that as the to version, and find the from
	// version to compare. E.g:
	// > origami-bundle-size v1.0.0
	// from: v1.0.0
	// to: the latest commit (HEAD)
	if (argv.length === 1) {
		from = await LocalComponent.create(argv[0]);
		to = await LocalComponent.create('commit');
	}

	// Do not expect only two arguments
	if (argv.length === 2) {
		throw new Error('Incorrect number of arguments, see "origami-bundle-size --help"');
	}

	// If three arguments are given, we have been given the name, to, and from
	// versions specifically. E.g:
	// > origami-bundle-size o-table v7.0.0 v7.4.0
	if (argv.length === 3) {
		from = await RemoteComponent.create(argv[0], argv[1]);
		to = await RemoteComponent.create(argv[0], argv[2]);
	}

	return {
		from,
		to
	};
};
