'use strict';

import {head, isString, isFunction} from 'lodash';
import resolveDep from 'resolve-dep';
import pkg from '../options/package';

function load(modules) {
  try {
    return require(head(modules));
  } catch (ignored) {
    // ignored;
  }
}

export default function resolver(pattern) {
  if (isString(pattern)) {
    const result = resolveDep([
      pattern,
      `${pkg.name}-*-${pattern}`
    ]);
    return load(result);
  }
  if (isFunction(pattern)) {
    return pattern;
  }
}
