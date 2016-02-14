'use strict';

var pkg = require('./package.json');
var globby = require('globby');
var _ = require('lodash');
var path = require('path');

module.exports = function(config) {
  config.set({
    frameworks: [
      'mocha',
      'browserify'
    ],
    files: globby.sync([
      'node_modules/babel-polyfill/dist/polyfill.min.js',
      './src/**/*.js',
      './test/unit/**/*.js',
      '!./src/util/async-listener.js',
      '!./src/plugins/resolver.js',
      '!./src/options/rc.js'
    ]),
    preprocessors: {
      './src/**/*.js': ['browserify'],
      './test/**/*.js': ['browserify']
    },
    browserify: {
      debug: true,
      transform: pkg.browserify.transform
    },
    reporters: [
      'mocha'
    ],
    logLevel: 'WARN',
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: false
  });
};
