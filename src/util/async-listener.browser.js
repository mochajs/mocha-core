'use strict';

import 'zone.js';
import _ from 'lodash';

process.addAsyncListener = (hooks = {}) => {
  hooks.onError = hooks.onError || hooks.error;
  return zone.fork(hooks);
};

process.removeAsyncListener = _.noop;
