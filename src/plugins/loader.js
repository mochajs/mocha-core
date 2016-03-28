import resolver from './resolver';
import Plugin from './index';
import {get, flow, negate, every, curry} from 'lodash/fp';
import {remove} from '../util';
import {Kefir} from 'kefir';
import stampit from 'stampit';
import {EventEmittable, Mappable} from '../core';
import is from 'check-more-types';

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

export const assertUnused = curry(function assertUnused (unloadedPlugins,
  opts) {
  const name = helpers.getName(opts);
  if (unloadedPlugins.has(name)) {
    throw new Error(`Plugin with name "${name}" is already used`);
  }
  return opts;
});

export const build = curry(function build (unloadedPlugins, opts) {
  const plugin = Plugin(Object.assign({}, opts.func.attributes, opts));
  unloadedPlugins.add(plugin.name);
  return plugin;
});

const PluginLoader = stampit({
  props: {
    streams: {}
  },
  init () {
    this.loadedPlugins = Mappable();
    this.seenPlugins = new Set();
    this.unloadedPlugins = new Set();

    const pluginReady = flow(get('dependencies'),
      every(dep => this.loadedPlugins.has(dep)));
    const pluginNotReady = negate(pluginReady);
    const loadStream = this.loadStream =
      Kefir.stream(this.createLoadStream.bind(this))
        .map(build(this.seenPlugins))
        .onValue(plugin => this.unloadedPlugins.add(plugin.name));
    const withoutDeps = loadStream.filter(pluginReady);

    // TODO make this more efficient with reduce-like function (try scan()?)
    const withDeps = loadStream.filter(pluginNotReady)
      .sampledBy(withoutDeps, plugin => pluginReady(plugin) && plugin)
      .filter();

    withoutDeps.merge(withDeps)
      .onValue(plugin => {
        plugin.install();
        this.unloadedPlugins.delete(plugin.name);
        this.loadedPlugins.set(plugin.name, plugin);
      })
      .takeErrors(1)
      .onError(err => this.onDone(err))
      .onEnd(() => {
        let err = null;
        if (this.unloadedPlugins.size) {
          err = new Error(`Dependencies not satisfied for plugin(s): ${Array.from(
              this.unloadedPlugins)}`);
        }
        this.onDone(err, this.loadedPlugins);
      });
  },
  methods: {
    createLoadStream (emitter) {
      const preprocess = flow(resolve,
        assertResolved,
        normalize,
        assertAttributes,
        assertUnused(this.unloadedPlugins));

      const onLoad = (opts = {}) => {
        try {
          emitter.emit(preprocess(opts));
        } catch (err) {
          emitter.error(err);
        }
      };

      function onceDump () {
        emitter.end();
        this.unloadedPlugins = new Set();
      }

      this.on('load', onLoad);
      this.once('dump', onceDump);

      return () => {
        this.removeListener('load', onLoad);
        this.removeListener('dump', onceDump);
      };
    },
    load (opts = {}) {
      this.emit('load', opts);
    },
    dump () {
      let plugins;
      this.once('done', loadedPlugins => {
        plugins = loadedPlugins;
      });
      this.emit('dump');
      return plugins;
    }
  }
})
  .compose(EventEmittable);

export default PluginLoader;
