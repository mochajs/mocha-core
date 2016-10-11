/* global zone */

import {noop} from 'lodash';
import 'zone.js/dist/zone-microtask';

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
