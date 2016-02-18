'use strict';

import 'trace';
import 'clarify';
import 'async-listener';

Error.stackTraceLimit = Infinity;

export default function createExecutionContext (opts = {}) {
  opts.create = opts.onAddTask;
  opts.error = opts.onError;
  const listener = process.addAsyncListener(opts);
  return {
    run (func, ctx, ...args) {
      return func.apply(ctx, args);
    },
    destroy () {
      process.removeAsyncListener(listener);
    }
  };
}
