'use strict';

import resolver from './resolver';
import Plugin from './index';
import {get, isString, isFunction, every, some} from 'lodash';
import {remove} from '../util';
import {ok as assert} from 'assert';
import {Kefir} from 'kefir';
let usedPlugins = new Set();
const removePkg = remove('pkg');

export function resolve (opts = {}) {
  opts.func = resolver(opts.pattern);
}

export function assertResolved (opts = {}) {
  assert(isFunction(opts.func),
    `Could not resolve plugin by pattern "${opts.pattern}"`);
}

export function normalize (opts = {}) {
  const {func} = opts;
  const {attributes} = func;
  attributes.dependencies = [].concat(attributes.dependencies || []);
  func.attributes = Object.assign({}, attributes.pkg, removePkg(attributes));
}

export function assertAttributes (opts = {}) {
  assert(isString(get(opts, 'func.attributes.name')),
    `Plugin must have a "name" property in its "attributes" object`);
}

export function assertUnused (opts = {}) {
  const name = get(opts, 'func.attributes.name');
  assert(!usedPlugins.has(name),
    `Plugin with name "${name}" is already loaded`);
}

export function build (opts = {}) {
  const plugin = Plugin(Object.assign({}, opts.func.attributes, opts));
  usedPlugins.add(plugin.name);
  return plugin;
}

export default function loader (stream) {
  return stream.doto(resolve)
    .doto(assertResolved)
    .doto(normalize)
    .doto(assertAttributes)
    .doto(assertUnused)
    .map(build);
}

export function kLoader (pluggable) {
  usedPlugins = new Set();

  const useStream = Kefir.fromEvents(pluggable, 'use')
    .log('use plugin')
    .onValue(resolve)
    .onValue(assertResolved)
    .onValue(normalize)
    .onValue(assertAttributes)
    .onValue(assertUnused)
    .map(build)
    .skipDuplicates((a, b) => a.name === b.name);

  function install (plugin) {
    plugin.install();
    pluggable.plugins.set(plugin.name, plugin);
    pluggable.emit('installed', plugin.name);
  }

  function hasAllDeps (plugin) {
    return every(plugin.dependencies, dep => pluggable.plugins.has(dep));
  }

  const withoutDeps = useStream.filter(hasAllDeps)
    .onValue(install);

  // TODO make this more efficient with reduce-like function (try scan()?)
  const withDeps = useStream.filter(
    plugin => some(plugin.dependencies, dep => !pluggable.plugins.has(dep)))
    .sampledBy(withoutDeps, plugin => hasAllDeps(plugin) && plugin)
    .filter()
    .onValue(install);

  return withoutDeps.merge(withDeps);
}
