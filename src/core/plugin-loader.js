'use strict';

const stampit = require('stampit');
const Promise = require('bluebird');
const DepGraph = require('dependency-graph').DepGraph;
const domain = require('domain');
const each = require('lodash/collection/each');

const PluginLoader = stampit({
  methods: {
    *[Symbol.iterator]() {
      for (let key in this.depGraph.overallOrder()) {
        yield key;
      }
    },
    set(name, plugin, dependencies) {
      const plugins = this.plugins;
      if (plugins.has(name)) {
        throw new Error(`Plugin "${name}" already added`);
      }
      const depGraph = this.depGraph;
      plugins.set(name, plugin);
      dependencies = [].concat(dependencies || []);
      depGraph.addNode(name);
      each(dependencies, (dep) => {
        depGraph.addDependency(name, dep);
      });
    },
    load: Promise.coroutine(function *() {
      for (let key of this) {
        const d = domain.create();
        d.on('error', (err) => {
          this.emit('error', err);
        });
        d.run(this.plugins[key]);
        yield;
      }
    }),
    emit(event, data) {
      if (event === 'error') {
        throw data;
      }
    }
  },
  init() {
    this.plugins = new Map();
    this.depGraph = new DepGraph();
  }
});

module.exports = PluginLoader;
