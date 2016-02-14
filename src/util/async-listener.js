'use strict';

function patch (addAsyncListener) {
  return function () {
    const listener = addAsyncListener.apply(null, arguments);
    listener.run = (func, ctx, ...args) => {
      return func.apply(ctx, args);
    };
    return listener;
  };
}

if (!process.addAsyncListener) {
  require('async-listener');
  process.addAsyncListener = patch(process.addAsyncListener);
}

