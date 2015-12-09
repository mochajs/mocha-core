'use strict';

const partialRight = require('lodash/function/partialRight');
const dump = partialRight(require('util').inspect, {
  depth: null
});

module.exports = dump;
