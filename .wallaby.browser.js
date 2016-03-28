'use strict';

/* eslint import/no-require:0 */

module.exports = function wallabyConfig (wallaby) {
  return {
    files: [
      {
        pattern: 'node_modules/babel-polyfill/dist/polyfill.js',
        instrument: false
      },
      {
        pattern: 'src/**/*.js',
        load: false
      },
      {
        pattern: 'test/fixture.js',
        load: false
      },
      {
        pattern: 'test/unit/**/*.spec.js',
        ignore: true
      },
      {
        pattern: 'package.json',
        load: false
      },
      {
        pattern: 'node_modules/mocha-ui-bdd/**',
        instrument: false,
        load: false
      }
    ],
    tests: [
      {
        pattern: 'test/unit/**/*.spec.js',
        load: false
      }
    ],
    env: {
      runner: require('phantomjs-prebuilt').path,
      params: {
        runner: '--web-security=false'
      }
    },
    compilers: {
      '**/*.js': wallaby.compilers.babel()
    },
    postprocessor: require('wallabify')({
      debug: true,
      entryPatterns: [
        'test/fixture.js',
        'test/unit/**/*.spec.js'
      ],
      ignore: 'test/unit/plugins/resolver.spec.js'
    }),
    testFramework: 'mocha',
    bootstrap: function bootstrap () {
      window.__moduleBundler.loadTests();
    },
    debug: true
  };
};
