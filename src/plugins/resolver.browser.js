'use strict';

import {isFunction} from 'lodash';

export default function resolver (pattern) {
  if (isFunction(pattern)) {
    return pattern;
  }
}
