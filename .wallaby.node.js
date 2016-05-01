'use strict';

/* eslint import/no-require:0 */

module.exports = function wallabyConfig (wallaby) {
  return {
    files: [
      'src/**/*.js',
      'test/fixture.js',
      'package.json'
    ],
    tests: [
      'test/**/*.spec.js'
    ],
    env: {
      type: 'node',
      runner: 'node'
    },
    compilers: {
      '**/*.js': wallaby.compilers.babel()
    },
    workers: {
      recycle: true
    },
    testFramework: 'mocha',
    bootstrap: function bootstrap (wallaby) {
      require(require('path')
        .join(wallaby.projectCacheDir, 'test', 'fixture'));
    },
    debug: true
  };
};
