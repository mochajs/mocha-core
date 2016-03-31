import is from 'check-more-types';
import mocha from '../index';
import {camelCase} from 'lodash';

export default function resolver (pattern) {
  if (is.function(pattern)) {
    return pattern;
  }
  if (is.string(pattern)) {
    const func = mocha.plugins[camelCase(pattern)];
    if (is.function(func)) {
      return func;
    }
  }
}
