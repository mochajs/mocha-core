'use strict';

const Plugin = require('./plugin');
const EventEmittable = require('./base/eventemittable');
const _ = require('lodash');
const stampit = require('stampit');
const Graphable = require('./base/graphable');
const PluginMap = require('./plugin-map');
const APIError = require('../util/custom-error')('APIError');

const API = stampit({
  refs: {
    depGraph: Graphable()
  },
  init() {
    this.plugins = PluginMap();
  },
  static: {
    APIError,
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
    spawn(api = API) {
      return api.props({depGraph: this.depGraph});
    },
    use(func, opts = {}) {
      const attrs = API.normalizeAttributes(func.attributes);
      const {name} = attrs;
      const plugins = this.plugins;

      if (!plugins.isUsable(attrs)) {
        throw APIError(`Plugin "${name}" cannot be used multiple times`);
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

      if (missingDeps.length) {
        plugin.installWhenReady(missingDeps);
      } else {
        plugin.install();
      }

      return this;
    }
  }
})
  .compose(EventEmittable);

module.exports = API;
