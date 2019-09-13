origami-bundle-size-cli
======================

**This is a work in progress:** Find the difference in JS and CSS bundle size between component versions.

Run within a component directory to compare the bundle sizes of HEAD against the
latest release (HEAD must be pushed to Github).

`origami-bundle-size`

Or within a component directory and provide a verison to compare HEAD against.

`origami-bundle-size v1.0.0`

Or compare the bundle size of any two published versions of a given Origami
component.

`origami-bundle-size o-table v5.0.0 v7.4.0`

```
o-table bundle size difference from v5.0.0 to v7.4.0
js: 38.16kb increase (9.87kb/gzip)
css, master: 12.08kb increase (1.64kb/gzip)
```
