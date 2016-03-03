'use strict';

import resolver from './resolver';
import Plugin from './index';
import {isString, isFunction, get, flow, negate, every, curry} from 'lodash/fp';
import {remove} from '../util';
import {Kefir} from 'kefir';

let usedPlugins = new Set();

export const helpers = {
  removePkg: remove('pkg'),
  getName: get('func.attributes.name')
};

export function resolve (opts = {}) {
  return Object.assign({func: resolver(opts.pattern)}, opts);
}

export function assertResolved (opts = {}) {
  if (!isFunction(opts.func)) {
    throw new Error(`Could not resolve plugin by pattern "${opts.pattern}"`);
  }
  return opts;
}

export function normalize (opts = {}) {
  const {func} = opts;
  const {attributes} = func;
  attributes.dependencies = [].concat(attributes.dependencies || []);
  func.attributes =
    Object.assign({}, attributes.pkg, helpers.removePkg(attributes));
  return opts;
}

export function assertAttributes (opts = {}) {
  if (!isString(helpers.getName(opts))) {
    throw new Error(`Plugin must have a "name" property in its "attributes" object`);
  }
  return opts;
}

export const assertUnused = curry(function assertUnused (usedPlugins, opts) {
  const name = helpers.getName(opts);
  if (usedPlugins.has(name)) {
    throw new Error(`Plugin with name "${name}" is already used`);
  }
  return opts;
});

export const build = curry(function build (usedPlugins, opts) {
  const plugin = Plugin(Object.assign({}, opts.func.attributes, opts));
  usedPlugins.add(plugin.name);
  return plugin;
});

export default function loader (pluggable) {
  const pluginReady = flow(get('dependencies'),
    every(dep => pluggable.plugins.has(dep)));
  const pluginNotReady = negate(pluginReady);

  const preprocess = flow(resolve,
    assertResolved,
    normalize,
    assertAttributes,
    assertUnused(usedPlugins));

  function activateUseStream (emitter) {
    function onUse (opts = {}) {
      try {
        emitter.emit(preprocess(opts));
      } catch (err) {
        emitter.error(err);
      }
    }

    function onReady () {
      emitter.end();
      usedPlugins = new Set();
    }

    pluggable.on('use', onUse);
    pluggable.on('ready', onReady);

    return function deactivateUseStream () {
      pluggable.removeListener('use', onUse);
      pluggable.removeListener('ready', onReady);
    };
  }

  const useStream = Kefir.stream(activateUseStream)
    .map(build(usedPlugins));

  function install (plugin) {
    plugin.install();
    pluggable.plugins.set(plugin.name, plugin);
    pluggable.emit('installed', plugin.name);
  }

  const withoutDeps = useStream.filter(pluginReady);

  // TODO make this more efficient with reduce-like function (try scan()?)
  const withDeps = useStream.filter(pluginNotReady)
    .sampledBy(withoutDeps, plugin => pluginReady(plugin) && plugin)
    .filter();

  withoutDeps.merge(withDeps)
    // .takeErrors(1)
    // .onError(err => {
    //   console.log(`err count ${++errCount}: ${err}`);
    //   err.message += ` ** ${errCount}`;
    //   pluggable.emit('error', err);
    // })
    .onValue(install);

  return useStream;
}
