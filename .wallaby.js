'use strict';

var babel = require('babel-core');

module.exports = function wallabyConfig() {
  return {
    files: [
      'src/**/*.js',
      {
        pattern: 'test/fixture.js',
        instrument: false
      },
      'package.json'
    ],
    tests: [
      'test/**/*.spec.js'
    ],
    env: {
      type: 'node',
      runner: 'node'
    },
    preprocessors: {
      '**/*.js': function(file) {
        return babel.transform(file.content, {
          sourceMap: true,
          presets: 'es2015'
        });
      }
    },
    testFramework: 'mocha',
    debug: true,
    bootstrap: function bootstrap(wallaby) {
      var path = require('path');
      require(path.join(wallaby.projectCacheDir, 'test', 'fixture'));
    }
  };
};
