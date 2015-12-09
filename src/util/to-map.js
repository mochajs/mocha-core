'use strict';

const isArray = require('lodash/lang/isArray');
const isObject = require('lodash/lang/isObject');
const pairs = require('lodash/object/pairs');

function toMap(value) {
  if (!(value instanceof Map)) {
    if (isArray(value)) {
      value = new Map(value);
    } else if (isObject(value)) {
      value = new Map(pairs(value));
    } else {
      value = new Map();
    }
  }
  return value;
}

module.exports = toMap;
