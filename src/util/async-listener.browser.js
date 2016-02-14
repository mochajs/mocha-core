'use strict';

require('zone.js/dist/zone');
import noop from 'lodash/noop';

process.addAsyncListener = (hooks = {}) => {
  hooks.onError = hooks.onError || hooks.error;
  return zone.fork(hooks);
};

process.removeAsyncListener = noop;
