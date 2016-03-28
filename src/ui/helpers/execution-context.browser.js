/* global zone */

import noop from 'lodash/noop';
import 'zone.js/dist/zone-microtask';

let currentZone;

function enable (opts = {}) {
  currentZone = zone.fork({
    addTask: opts.onAsync || noop,
    onError: opts.onError || noop
  });
}

function run (func, ctx, ...args) {
  // const boundFunc = func.bind(ctx, ...args);
  return currentZone.run(func, ctx, args);
}

export {run, enable, noop as disable};
