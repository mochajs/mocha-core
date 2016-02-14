'use strict';

import _ from 'highland';

export const remove = _.curry(function remove (prop, obj) {
  delete obj[prop];
  return obj;
});

export const every = _.curry(function every (stream, callback) {
  return stream.reduce(true, (acc, value, key) => {
    return acc && callback(value, key);
  });
});
