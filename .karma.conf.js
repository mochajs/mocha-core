'use strict';

/* eslint import/no-require:0 */
var globby = require('globby');

module.exports = function (config) {
  config.set({
    frameworks: [
      'mocha',
      'browserify',
      'source-map-support'
    ],
    files: globby.sync([
      'node_modules/babel-polyfill/dist/polyfill.min.js',
      './src/**/*.js',
      './test/unit/**/*.js',
      '!./src/index.js',
      '!./src/util/execution-context.js',
      '!./src/plugins/resolver.js',
      '!./src/options/rc.js'
    ]),
    preprocessors: {
      './src/**/*.js': ['browserify'],
      './test/**/*.js': ['browserify']
    },
    browserify: {
      debug: true,
      transform: [
        [
          'babelify',
          {
            sourceMapRelative: '.'
          }
        ]
      ]
    },
    reporters: [
      'mocha-clean'
    ],
    mochaReporter: {
      output: 'autowatch'
    },
    logLevel: 'WARN',
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: false
  });
};
