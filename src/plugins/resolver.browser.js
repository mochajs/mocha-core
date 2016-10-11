import is from 'check-more-types';
import {prop, find} from 'lodash/fp';

const resolver = {
  resolve (pattern) {
    if (is.function(pattern)) {
      return pattern;
    }
    if (is.string(pattern)) {
      const func = find([
        'attributes.name',
        pattern
      ], prop('mocha.plugins', global) || {});
      if (is.function(func)) {
        return func;
      }
    }
  }
};

export default resolver;
