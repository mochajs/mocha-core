import 'async-listener';
import _ from 'lodash';

const listener = process.addAsyncListener({
  create: _.noop,
  error: _.noop
});

function enable (opts = {}) {
  listener.create = opts.onCreate || _.noop;
  listener.error = opts.onError || _.noop;
}

function run (func, context, ...args) {
  return func.apply(context, args);
}

function disable () {
  listener.error = listener.create = _.noop;
}

export {enable, run, disable};
