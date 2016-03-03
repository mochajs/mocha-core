'use strict';

import {curry, isEmpty} from 'lodash/fp';

export const remove = curry(function remove (prop, obj) {
  delete obj[prop];
  return obj;
});

export function collapse (value) {
  if (!isEmpty(value)) {
    return value;
  }
}
