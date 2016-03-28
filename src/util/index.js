import './mixins';
import {curry} from 'lodash/fp';

export const remove = curry(function remove (prop, obj) {
  delete obj[prop];
  return obj;
});
