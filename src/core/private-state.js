'use strict';

const isFunction = require('lodash/lang/isFunction');
const mapValues = require('lodash/object/mapValues');

module.exports = function (stamp, state = {}) {
  const privateState = new WeakMap();

  if (stamp) {
    stamp.fixed.init = (stamp.fixed.init || []).concat(function () {
      privateState.set(this, mapValues(state, value => {
        return isFunction(value) ? value.bind(this) : value;
      }));
    });
  }
  return privateState;
};
