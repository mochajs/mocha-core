'use strict';

const stampit = require('stampit');
const PluginMap = require('./plugin-map');
const Graphable = require('./base/graphable');
const EventEmittable = require('./base/eventemittable');
const Plugin = require('./plugin');

const _ = require('lodash');

const Pluggable = stampit({
  init() {
    _.defaults(this, {
      depGraph: Graphable(),
      pluginMap: PluginMap()
    });
  },
  static: {
    normalizeAttributes(attrs) {
      attrs = _.cloneDeep(attrs);
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
      const depGraph = this.depGraph;
      const api = this;

      if (!pluginMap.isUsable(attrs)) {
        throw new Error(`Plugin "${name}" cannot be used multiple times`);
      }

      const plugin = Plugin(_.assign({
        func,
        opts,
        depGraph,
        api
      }, attrs))
        .once('did-install', () => this.emit(`did-install:${name}`));

      pluginMap.set(name, plugin);

      if (pluginMap.isInstallable(name)) {
        plugin.install();
      } else {
        plugin.installWhenReady(pluginMap.missingDeps(name));
      }

      return this;
    }
  }
})
  .compose(EventEmittable);

module.exports = Pluggable;
