'use strict';

if (!global._babelPolyfill) {
  require('babel-polyfill');
}

module.exports = require('./mocha')();
