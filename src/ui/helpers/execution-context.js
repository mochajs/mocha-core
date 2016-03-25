'use strict';

import 'async-listener';

const noop = function () {};

const listener = process.addAsyncListener({
  create: noop,
  error: noop
});

function enable (opts = {}) {
  listener.create = opts.onCreate || noop;
  listener.error = opts.onError || noop;
}

function run (func, context, ...args) {
  return func.apply(context, args);
}

function disable () {
  listener.error = listener.create = noop;
}

export {enable, run, disable};
