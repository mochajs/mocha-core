import is from 'check-more-types';
import resolveDep from 'resolve-dep';
import {find} from 'lodash/fp';
import pkg from '../options/package';

const namespace = 'mocha';

const requireAny = find(pluginPath => {
  try {
    return require(pluginPath);
  } catch (ignored) {
  }
});

const resolver = {resolveDep};

resolver.resolve = function resolve (pattern) {
  if (is.string(pattern)) {
    const patterns = [
      pattern,
      `${namespace}-*-${pattern}`
    ];
    return requireAny(this.resolveDep(patterns), {
      config: pkg
    });
  }

  if (is.function(pattern)) {
    return pattern;
  }
}.bind(resolver);

export default resolver;
