# Migration Guides

## Migrating from v1 to v2

- Requires node 12 or later.
- Removes the ability to compare bundle sizes of any ref pushed to Github. It is now only possible to compare the bundle sizes of releases. This is because the [Origami Build Service](https://www.ft.com/__origami/service/build/) drops support for bundling commit references for components which follow v2 of the Origami Component Specification.
- Requires 3 arguments, the component name and two versions to compare.
