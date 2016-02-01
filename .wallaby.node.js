'use strict';

module.exports = function wallabyConfig(wallaby) {
  return {
    files: [
      'src/**/*.js',
      'test/unit/fixture.js',
      'package.json'
    ],
    tests: [
      'test/unit/**/*.spec.js'
    ],
    env: {
      type: 'node',
      runner: 'node'
    },
    compilers: {
      '**/*.js': wallaby.compilers.babel({
        presets: [
          'es2015',
          'stage-3'
        ],
        plugins: [
          'lodash'
        ],
        sourceMaps: true
      })
    },
    testFramework: 'mocha',
    bootstrap: function bootstrap(wallaby) {
      // TODO set NODE_PATH here once we start forking things
      /* eslint import/no-require:0 */
      require(require('path')
        .join(wallaby.projectCacheDir, 'test', 'unit', 'fixture'));
    },
    debug: true
  };
};
