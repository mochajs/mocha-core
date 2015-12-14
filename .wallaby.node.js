'use strict';

module.exports = function wallabyConfig(wallaby) {
  return {
    files: [
      'src/**/*.js',
      {
        pattern: 'test/unit/fixture.js',
        instrument: false
      },
      'package.json'
    ],
    tests: [
      'test/unit/**/*.spec.js'
    ],
    env: {
      type: 'node',
      runner: 'node',
      params: {
        env: 'DEBUG=mocha:core:*'
      }
    },
    compilers: {
      '**/*.js': wallaby.compilers.babel({
        babel: require('babel-core'),
        sourceMap: true,
        presets: ['es2015']
      })
    },
    testFramework: 'mocha',
    debug: true,
    bootstrap: function bootstrap(wallaby) {
      // set NODE_PATH here once we start forking things
      require(require('path')
        .join(wallaby.projectCacheDir, 'test', 'unit', 'fixture'));
    }
  };
};
