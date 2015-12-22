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
      plugins: PluginMap()
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
      const plugins = this.plugins;

      if (!plugins.isUsable(attrs)) {
        throw new Error(`Plugin "${name}" cannot be used multiple times`);
      }

      const plugin = Plugin(_.assign({
        func,
        opts,
        depGraph: this.depGraph,
        api: this
      }, attrs))
        .once('did-install', () => this.emit(`did-install:${name}`));

      plugins.set(name, plugin);

      const missingDeps = _.reject(plugin.dependencies,
        dep => plugins.isInstalled(dep));

      if (_.isEmpty(missingDeps)) {
        plugin.install();
      } else {
        plugin.installWhenReady(missingDeps);
      }

      return this;
    }
  }
})
  .compose(EventEmittable);

module.exports = Pluggable;
