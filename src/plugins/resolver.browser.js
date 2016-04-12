import is from 'check-more-types';
import {get, find} from 'lodash/fp';

export default function resolver (pattern) {
  if (is.function(pattern)) {
    return pattern;
  }
  if (is.string(pattern)) {
    const func = find(['attributes.name', pattern], get('mocha.plugins', global) || {});
    if (is.function(func)) {
      return func;
    }
  }
}
