import is from 'check-more-types';
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
  if (is.string(pattern)) {
    const result = resolveDep([
      pattern,
      `${pkg.name}-*-${pattern}`
    ]);
    return load(result);
  }
  if (is.function(pattern)) {
    return pattern;
  }
}
