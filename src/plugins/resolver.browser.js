'use strict';

import {isFunction} from 'lodash';

export function resolve (pattern) {
  if (isFunction(pattern)) {
    return pattern;
  }
}
