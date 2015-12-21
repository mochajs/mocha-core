'use strict';

function makeArray(value) {
  return [].concat(value || []);
}

module.exports = makeArray;
