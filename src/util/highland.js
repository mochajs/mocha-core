'use strict';

import _ from 'highland';
import {isObject} from 'lodash';

_.remove = _.curry(function remove(prop, obj) {
  delete obj[prop];
  return obj;
});

_.fromPrimitive = function fromPrimitive(value) {
  if (isObject(value)) {
    return _(value);
  }
  return _([]).append(value).compact();
};

export default _;
