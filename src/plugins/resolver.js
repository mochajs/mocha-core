import is from 'check-more-types';
import resolve from 'resolve-dep';
import {find} from 'lodash/fp';
import pkg from '../options/package';

const namespace = 'mocha';

const requireAny = find(pluginPath => {
  try {
    return require(pluginPath);
  } catch (ignored) {
  }
});

export default function resolver (pattern) {
  if (is.string(pattern)) {
    const patterns = [
      pattern,
      `${namespace}-*-${pattern}`
    ];
    return requireAny(resolve(patterns), {
      config: pkg
    });
  }

  if (is.function(pattern)) {
    return pattern;
  }
}
