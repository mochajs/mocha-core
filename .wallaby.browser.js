'use strict';

/* eslint import/no-require:0 */

module.exports = function wallabyConfig (wallaby) {
  return {
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      {
        pattern: 'src/**/*.js',
        load: false
      },
      {
        pattern: 'test/unit/fixture.js',
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
      runner: 'phantomjs'
    },
    compilers: {
      'src/**/*.js': wallaby.compilers.babel(),
      'test/unit/**/*.js': wallaby.compilers.babel()
    },
    postprocessor: require('wallabify')({
      debug: true,
      entryPatterns: [
        'test/unit/fixture.js',
        'test/unit/**/*.spec.js'
      ]
    }),
    testFramework: 'mocha',
    bootstrap: function bootstrap () {
      window.__moduleBundler.loadTests();
    },
    debug: true
  };
};
