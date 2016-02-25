'use strict';

import {isString, isFunction} from 'lodash';
import resolveDep from 'resolve-dep';
import pkg from '../options/package';

export function load (pluginPaths = []) {
  if (Array.isArray(pluginPaths)) {
    const pluginPath = pluginPaths.shift();
    if (pluginPath) {
      try {
        return require(pluginPath);
      } catch (ignored) {
        return load(pluginPaths);
      }
    }
  }
}

export default function resolver (pattern) {
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
