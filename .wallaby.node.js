'use strict';

/* eslint import/no-require:0 */

module.exports = function wallabyConfig(wallaby) {
  return {
    files: [
      'src/**/*.js',
      'test/unit/fixture.js',
      'package.json',
      {
        pattern: 'node_modules/mocha-ui-bdd/**',
        instrument: false
      }
    ],
    tests: [
      'test/unit/**/*.spec.js'
    ],
    env: {
      type: 'node',
      runner: 'node'
    },
    compilers: {
      '**/*.js': wallaby.compilers.babel()
    },
    testFramework: 'mocha',
    bootstrap: function bootstrap(wallaby) {
      // TODO set NODE_PATH here once we start forking things?
      require(require('path')
        .join(wallaby.projectCacheDir, 'test', 'unit', 'fixture'));
    },
    debug: true
  };
};
