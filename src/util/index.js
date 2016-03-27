import './mixins';
import {curry} from 'lodash/fp';
import is from 'check-more-types';

export const remove = curry(function remove (prop, obj) {
  delete obj[prop];
  return obj;
});

export function collapse (value) {
  if (is.not.empty(value)) {
    return value;
  }
}
