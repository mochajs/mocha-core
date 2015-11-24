'use strict';

const PluginLoader = require('./plugin-loader');
const partial = require('lodash/function/partial');
const get = require('lodash/object/get');
const stampit = require('stampit');

const API = stampit({
  methods: {
    use(plugin, opts) {
      this.loader.set(plugin.attributes.name,
        partial(plugin, this, opts),
        get(plugin, 'attributes.dependencies'));
      return this;
    },
    version() {
      return this.__version || require('../../package.json').version;
    },
    load() {
      return this.loader.load();
    }
  },
  init() {
    this.loader = new PluginLoader();
  }
});

module.exports = API;

