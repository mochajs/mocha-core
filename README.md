# mocha-core

> Mocha's guts

To be installed as a dependency of the `mocha` package, alongside `mocha-cli`, `mocha-ui-bdd` (default UI), `mocha-reporter-spec` & `mocha-reporter-html` (default reporters), and default runner(s) (TBD).

## Testing

See `package.json`'s `scripts` field for more info.

- All tests: `npm test`
  - Includes lint checks
  - Includes extra/missing/security dependency checks
- Node.js tests only: `npm test:node`
- Browser tests only: `npm test:browser`

## Building

- `npm run build`
  - Compiles `src/` into `lib/` for Node.js
  - Compiles `src/` into `dist/` for browsers

Must be run as part of `prepublish` as neither `lib/` nor `dist/` are under VCS.

## License

Apache-2.0, unless you have a better idea.
