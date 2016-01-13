'use strict';

module.exports = function(config) {
  config.set({
    frameworks: [
      'mocha',
      'browserify'
    ],
    files: [
      require.resolve('phantomjs-polyfill'),
      'src/**/*.js',
      'test/unit/**/*.js'
    ],
    preprocessors: {
      'src/**/*.js': 'browserify',
      'test/unit/**/*.js': 'browserify'
    },
    browserify: {
      debug: true
    },
    reporters: [
      'mocha'
    ],
    autoWatch: true,
    browsers: ['PhantomJS'],
    singleRun: false
  });
};
