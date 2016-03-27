
import noop from '../../../node_modules/lodash/noop';

/* eslint import/no-require:0 */
require('zone.js/dist/zone');
require('zone.js/dist/long-stack-trace-zone');

export default function createExecutionContext (opts = {}) {
  return {
    run (func, ctx, ...args) {
      const forkedZone = zone.fork({
        addTask: opts.onAddTask,
        onError: opts.onError
      });
      const boundFunc = func.bind(ctx, ...args);
      return forkedZone.run(boundFunc);
    },
    destroy: noop
  };
}
