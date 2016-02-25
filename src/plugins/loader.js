'use strict';

import resolver from './resolver';
import Plugin from './plugin';
import {get, isString} from 'lodash';

const usedPlugins = new Set();

export function resolve (opts = {}) {
  opts.func = resolver(opts.pattern);
}

export function assertResolved (opts = {}) {
  if (!opts.func) {
    throw new Error(`Could not resolve plugin by pattern "${opts.pattern}"`);
  }
}

export function normalize (opts = {}) {
  opts.func = Plugin.normalize(opts.func);
}

export function assertAttributes (opts = {}) {
  if (!isString(get(opts, 'func.attributes.name'))) {
    throw new Error(`Plugin must have a "name" property in its "attributes" object`);
  }
}

export function assertUnused (opts = {}) {
  const name = get(opts, 'func.attributes.name');
  if (usedPlugins.has(name)) {
    throw new Error(`Plugin "${name}" is already loaded`);
  }
}

export function build (opts = {}) {
  const plugin = Plugin(Object.assign({}, opts.func.attributes, opts));
  usedPlugins.add(plugin.name);
  return plugin;
}

export default function loader (stream) {
  return stream.fork()
    .doto(resolve)
    .doto(assertResolved)
    .doto(normalize)
    .doto(assertAttributes)
    .doto(assertUnused)
    .map(build);
}
