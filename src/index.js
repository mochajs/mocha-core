'use strict';

if (!global._babelPolyfill) {
  require('babel-polyfill');
}

const Mocha = require('./mocha');

module.exports = Mocha;
