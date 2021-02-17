
# Origami Bundle Size CLI

Find the difference in JS and CSS bundle size between component versions, including the gzip difference.

[![MIT licensed](https://img.shields.io/badge/license-MIT-blue.svg)][license]


## Table Of Contents

  * [Requirements](#requirements)
  * [Usage](#Usage)
  * [Testing](#testing)
  * [Migration Guides](#migration-guides)
  * [License](#license)


## Requirements

Origami Bundle Size CLI requires [Node.js] 12.x and [npm].

## Usage

First install Origami Bundle Size CLI:

```
npm install -g @financial-times/origami-bundle-size-cli
```

Run with the Origami component name and two release numbers to compare:
```
origami-bundle-size o-table v5.0.0 v7.4.0
```

Example output:
```
o-table bundle size difference from v5.0.0 v7.4.0
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

The tests and linter are run when commits are pushed, you can view [results on CI][ci]. They must pass before we merge a pull request.

## Migration Guides

State | Major Version | Last Minor Release | Migration guide |
:---: | :---: | :---: | :---:
⚠ maintained | 2 | N/A | [migrate to v2](MIGRATION.md#migrating-from-v1-to-v2) |
╳ deprecated | 1 | 1.1.3 | N/A |

## License

The Financial Times has published this software under the [MIT license][license].


[license]: http://opensource.org/licenses/MIT
[node.js]: https://nodejs.org/
[npm]: https://www.npmjs.com/
