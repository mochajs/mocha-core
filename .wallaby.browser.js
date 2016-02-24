'use strict';

/* eslint import/no-require:0 */

module.exports = function wallabyConfig (wallaby) {
  var compiler = wallaby.compilers.babel({
    sourceMaps: 'both',
    babelrc: true
  });

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
      runner: require('phantomjs-prebuilt').path,
      params: {
        runner: '--web-security=false'
      }
    },
    compilers: {
      'src/**/*.js': compiler,
      'test/unit/**/*.js': compiler
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
