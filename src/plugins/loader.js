import resolver from './resolver';
import Plugin from './plugin';
import {noop, get, flow, negate, every, curry} from 'lodash/fp';
import {remove} from '../util';
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
    },
    end (emitter) {
      emitter.end();
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
  return Object.assign({func: resolver(opts.pattern)}, opts);
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
    Object.assign({}, attributes.pkg, helpers.removePkg(attributes));
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

export const build = curry(function build (unloadedPlugins, opts) {
  const plugin = Plugin(Object.assign({}, helpers.getAttributes(opts), opts));
  unloadedPlugins.add(plugin.name);
  return plugin;
});

const PluginLoader = stampit({
  init () {
    this.reset();

    const pluginReady = flow(get('dependencies'),
      every(dep => this.loadedPlugins.has(dep)));
    const pluginNotReady = negate(pluginReady);
    const loadStream = this.loadStream = Kefir.stream(emitter => {
      this.loadEmitter = emitter;
      this.on('error', () => {
        emitter.end();
      });
    })
      .map(resolve)
      .withHandler(syncHandler(assertResolved))
      .map(normalize)
      .withHandler(syncHandler(assertAttributes))
      .withHandler(syncHandler(assertUnused(this.unloadedPlugins)))
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
      .onError(err => this.emit('error', err))
      .onEnd(() => {
        if (this.unloadedPlugins.size) {
          return this.emit('error',
            new Error(`Dependencies not satisfied for plugin(s): ${Array.from(
              this.unloadedPlugins)}`));
        }
        this.emit('done', this.loadedPlugins);
      });

    this.once('done', (...args) => {
      this.onDone(...args);
      this.reset();
    });
  },
  methods: {
    onDone: noop,
    reset () {
      this.unloadedPlugins = new Set();
      this.seenPlugins = new Set();
      this.loadedPlugins = Mappable();
    },
    load (opts = {}) {
      this.loadEmitter.emit(opts);
    },
    dump () {
      this.loadEmitter.end();
    }
  }
})
  .compose(EventEmittable);

export default PluginLoader;
