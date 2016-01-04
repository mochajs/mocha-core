'use strict';

const stampit = require('stampit');
const PluginMap = require('./plugin-map');
const Graphable = require('./base/graphable');
const EventEmittable = require('./base/eventemittable');
const Plugin = require('./plugin');

const _ = require('lodash');

const Pluggable = stampit({
  refs: {Plugin},
  init() {
    _.defaults(this, {
      depGraph: Graphable(),
      pluginMap: PluginMap()
    });
  },
  static: {
    normalizeAttributes(attrs = {}) {
      const pkg = attrs.pkg;
      if (_.isObject(pkg)) {
        _.defaults(attrs, {
          name: pkg.name,
          version: pkg.version,
          description: pkg.description
        });
      }
      attrs.dependencies = [].concat(attrs.dependencies || []);
      return attrs;
    }
  },
  methods: {
    use(func, opts = {}) {
      const attrs = Pluggable.normalizeAttributes(func.attributes);
      const {name} = attrs;
      const pluginMap = this.pluginMap;

      if (!pluginMap.isUsable(name)) {
        throw new Error(`Plugin "${name}" is already loaded`);
      }

      const depGraph = this.depGraph;
      const api = this;
      const instance = _.assign({}, attrs, {
        func,
        opts,
        depGraph,
        api
      });

      const plugin = this.Plugin(instance)
        .once('installed', () => this.emit(`did-install:${name}`));

      pluginMap.set(name, plugin);
      plugin.install(pluginMap.missingDeps(name));

      return this;
    }
  }
})
  .compose(EventEmittable);

module.exports = Pluggable;
