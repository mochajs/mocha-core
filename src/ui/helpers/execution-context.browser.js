/* global zone */

import noop from 'lodash/noop';
import 'zone.js/dist/zone-microtask';

// best effort
require('_process').nextTick = function () {
  return setImmediate.apply(null, arguments);
};

let currentZone;

function enable (opts = {}) {
  currentZone = zone.fork({
    onError: opts.onError || noop
  });
}

function run (func, ctx, ...args) {
  return currentZone.run(func, ctx, args);
}

export {run, enable, noop as disable};
