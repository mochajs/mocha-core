import is from 'check-more-types';
import {find} from 'lodash/fp';
import pkg from '../options/package';

const namespace = 'mocha';

const requireAny = find(pluginPath => {
  try {
    return global.require(pluginPath);
  } catch (ignored) {
  }
});

const resolver = {
  resolve (pattern) {
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
  }
};

export default resolver;
