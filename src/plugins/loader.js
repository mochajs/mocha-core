import resolver from './resolver';
import Plugin from './index';
import {get, flow, negate, every, curry} from 'lodash/fp';
import {remove} from '../util';
import {Kefir} from 'kefir';
import stampit from 'stampit';
import {EventEmittable, Mappable} from '../core';
import is from 'check-more-types';

let usedPlugins = new Set();

export const helpers = {
  removePkg: remove('pkg'),
  getName: get('func.attributes.name')
};

export function resolve (opts = {}) {
  return Object.assign({func: resolver(opts.pattern)}, opts);
}

export function assertResolved (opts = {}) {
  if (is.not.function(opts.func)) {
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
  if (is.not.string(helpers.getName(opts))) {
    throw new Error('Plugin must have a "name" property in its "attributes" object');
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

const PluginLoader = stampit({
  props: {
    streams: {}
  },
  init () {
    this.plugins = Mappable();

    const pluginReady = flow(get('dependencies'),
      every(dep => this.plugins.has(dep)));
    const pluginNotReady = negate(pluginReady);
    const loadStream = Kefir.stream(this.createLoadStream.bind(this))
      .map(build(usedPlugins));
    const withoutDeps = loadStream.filter(pluginReady);

    // TODO make this more efficient with reduce-like function (try scan()?)
    const withDeps = loadStream.filter(pluginNotReady)
      .sampledBy(withoutDeps, plugin => pluginReady(plugin) && plugin)
      .filter();

    withoutDeps.merge(withDeps)
      .takeErrors(1)
      .onError(err => this.emit('error', err))
      .onValue(plugin => {
        plugin.install();
        this.plugins.set(plugin.name, plugin);
      })
      .onEnd(() => this.emit('done', this.plugins));
  },
  methods: {
    createLoadStream (emitter) {
      const preprocess = flow(resolve,
        assertResolved,
        normalize,
        assertAttributes,
        assertUnused(usedPlugins));

      const onLoad = (opts = {}) => {
        try {
          emitter.emit(preprocess(opts));
        } catch (err) {
          emitter.error(err);
        }
      };

      function onDump () {
        emitter.end();
        usedPlugins = new Set();
      }

      this.on('load', onLoad);
      this.on('dump', onDump);

      return () => {
        this.removeListener('load', onLoad);
        this.removeListener('dump', onDump);
      };
    },
    load (opts = {}) {
      this.emit('load', opts);
    },
    dump () {
      this.emit('dump');
    }
  }
})
  .compose(EventEmittable);

export default PluginLoader;
