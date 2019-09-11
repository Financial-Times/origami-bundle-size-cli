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

`origami-bundle-size o-table v7.0.0 v7.4.0`

```
o-table diff from v7.0.0 to v7.4.0
css(master): 0.1kb decrease (0.04kb increase with gzip).
css(internal): 0.1kb decrease (0.04kb increase with gzip).
css(whitelabel): 0.1kb decrease (0.04kb increase with gzip).
js: 8.95kb increase (1.91kb increase with gzip).
```
