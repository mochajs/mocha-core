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
    testFramework: 'mocha',
    bootstrap: function bootstrap (wallaby) {
      wallaby.testFramework.timeout(0);
      // TODO set NODE_PATH here once we start forking things?
      require(require('path')
        .join(wallaby.projectCacheDir, 'test', 'fixture'));
    },
    debug: true
  };
};
