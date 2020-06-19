
# Origami Bundle Size CLI

Find the difference in JS and CSS bundle size between component versions, including the gzip difference.

[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)][license]


## Table Of Contents

  * [Requirements](#requirements)
  * [Useage](#useage)
  * [Testing](#testing)
  * [Publish](#publish)
  * [License](#license)


## Requirements

Origami Bundle Size CLI requires [Node.js] 10.x and [npm].

## Usage

First install  Origami Bundle Size CLI:

```
npm install -g origami-bundle-size-cli
```

Run within a component directory to compare the bundle sizes of HEAD against the
latest release (HEAD must be pushed to Github).
```
origami-bundle-size
```

Or within a component directory and provide a verison to compare HEAD against (HEAD must be pushed to Github).
```
origami-bundle-size v1.0.0
```

Or compare the bundle size of any two published versions of a given Origami
component.
```
origami-bundle-size o-table v5.0.0 v7.4.0
```

Example output:
```
o-table bundle size difference from v5.0.0 to v7.4.0
js: 38.16kb increase (9.87kb/gzip)
css, master: 12.08kb increase (1.64kb/gzip)
```

## Testing

The tests are split into unit tests and integration tests. To run all tests on your machine run `npm test`.

```sh
npm test                  # run all the tests
npm run test:unit         # run the unit tests
npm run test:integration  # run the integration tests
```

To run the linter locally, run:

```sh
npm run lint
```

The tests and linter are run when commits are pushed, you can view [results on CircleCI][ci]. They must pass before we merge a pull request.


## Publish

- Run `npm version [version]`, where version is major, minor, patch, [or some other version](https://docs.npmjs.com/cli/version).
- Open a PR which includes the updated `package.json`.
- When the PR is approved, merge and tag the release in Github.
- Tagging will trigger CircleCI to deploy to npm.

## License

The Financial Times has published this software under the [MIT license][license].


[ci]: https://circleci.com/gh/Financial-Times/origami-bundle-size-cli
[license]: http://opensource.org/licenses/MIT
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
