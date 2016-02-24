'use strict';

import noop from 'lodash/noop';
import 'trace';
import 'clarify';
import 'async-listener';

Error.stackTraceLimit = Infinity;

export default function createExecutionContext (opts = {}) {
  opts.create = opts.onAddTask;
  opts.error = opts.onError;
  opts.before = opts.onBeforeTask;
  opts.after = opts.onAfterTask;
  const listener = process.addAsyncListener(opts);
  return {
    listener,
    run (func, ctx, ...args) {
      return func.apply(ctx, args);
    },
    end () {
      process.removeAsyncListener(this.listener);
      return this;
    },
    restart (opts) {
      this.destroy();
      return createExecutionContext(opts);
    },
    destroy () {
      const listener = this.listener;
      listener.error = listener.create = listener.before = listener.after = noop;
      return this.end();
    }
  };
}
