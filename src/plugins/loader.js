import resolver from './resolver';
import Plugin from './plugin';
import {noop, get, flow, negate, every, curry} from 'lodash/fp';
import {assign} from 'lodash';
import {remove, Set} from '../util';
import {Kefir} from 'kefir';
import stampit from 'stampit';
import {EventEmittable, Mappable} from '../core';
import is from 'check-more-types';

export const helpers = {
  removePkg: remove('pkg'),
  getName: get('func.attributes.name'),
  getAttributes: get('func.attributes'),
  getFunc: get('value.func'),
  getPattern: get('value.pattern')
};

// TODO move this?
const SyncHandler = stampit({
  static: {
    value (emitter, value, func) {
      const retval = func(value);
      if (is.error(retval)) {
        return this.error(emitter, retval);
      }
      emitter.emit(retval);
    },
    error (emitter, value) {
      emitter.error(value);
    }
  },
  methods: {
    func: noop,
    handle (emitter, event) {
      return this.factory[event.type](emitter, event.value, this.func);
    }
  },
  init ({stamp}) {
    this.factory = stamp;
    this.handle = this.handle.bind(this);
  }
});

function syncHandler (func) {
  return SyncHandler({func}).handle;
}

export function resolve (opts = {}) {
  return assign({func: resolver.resolve(opts.pattern)}, opts);
}

export function assertResolved (opts = {}) {
  if (is.not.function(opts.func)) {
    return new Error(`Could not resolve plugin by pattern "${opts.pattern}"`);
  }
  return opts;
}

export function normalize (opts = {}) {
  const {func} = opts;
  const {attributes} = func;
  attributes.dependencies = [].concat(attributes.dependencies || []);
  func.attributes =
    assign({}, attributes.pkg, helpers.removePkg(attributes));
  return opts;
}

export function assertAttributes (opts = {}) {
  if (is.not.string(helpers.getName(opts))) {
    return new Error('Plugin must have a "name" property in its "attributes" object');
  }
  return opts;
}

export const assertUnused = curry(function assertUnused (unloadedPlugins,
  opts) {
  const name = helpers.getName(opts);
  if (unloadedPlugins.has(name)) {
    return new Error(`Plugin with name "${name}" is already used`);
  }
  return opts;
});

export const build = curry(function build (seenPlugins, opts) {
  const plugin = Plugin(assign({}, helpers.getAttributes(opts), opts));
  seenPlugins.add(plugin.name);
  return plugin;
});

const PluginLoader = stampit({
  init () {
    const unloadedPlugins = this.unloadedPlugins = new Set();
    this.seenPlugins = new Set();
    this.loadedPlugins = Mappable();

    const pluginReady = flow(get('dependencies'),
      every(dep => this.loadedPlugins.has(dep)));
    const pluginNotReady = negate(pluginReady);
    const loadStream = this.loadStream = Kefir.stream(emitter => {
      this.loadEmitter = emitter;
    })
      .map(resolve)
      .withHandler(syncHandler(assertResolved))
      .map(normalize)
      .withHandler(syncHandler(assertAttributes))
      .withHandler(syncHandler(assertUnused(unloadedPlugins)))
      .map(build(this.seenPlugins))
      .onValue(plugin => {
        unloadedPlugins.add(plugin.name);
        this.emit('plugin-loading', plugin);
      });

    const withoutDeps = loadStream.filter(pluginReady);

    // TODO make this more efficient with reduce-like function (try scan()?)
    const withDeps = loadStream.filter(pluginNotReady)
      .onValue(plugin => {
        this.emit('plugin-not-loaded', plugin.pattern);
      })
      .sampledBy(withoutDeps, plugin => pluginReady(plugin) && plugin)
      .filter();

    withoutDeps.merge(withDeps)
      .onValue(plugin => {
        try {
          plugin.install();
        } catch (err) {
          return this.emit('error', err);
        }
        this.loadedPlugins.set(plugin.name, plugin);
        this.emit('plugin-loaded', plugin);
        unloadedPlugins.delete(plugin.name);
        if (!this.unloadedPlugins.size) {
          this.emit('ready');
        }
      })
      .takeErrors(1)
      .onError(err => this.emit('error', err));
  },
  methods: {
    load (opts = {}) {
      this.loadEmitter.emit(opts);
    }
  }
})
  .compose(EventEmittable);

export default PluginLoader;
