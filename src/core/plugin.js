'use strict';

const EventEmittable = require('./base/eventemittable');
const customError = require('../util/custom-error');
const stampit = require('stampit');
const makeArray = require('../util/make-array');
const _ = require('lodash');

const PluginError = customError('PluginError');

const Plugin = stampit({
  props: {
    installed: false
  },
  static: {
    PluginError
  },
  init() {
    const depGraph = this.depGraph;
    const name = this.name;
    depGraph.addNode(name);
    const deps = makeArray(this.dependencies);

    _(deps)
      .reject(dep => depGraph.hasNode(dep))
      .forEach(dep => depGraph.addNode(dep))
      .value();

    _.forEach(deps, dep => depGraph.addDependency(name, dep));

    try {
      depGraph.dependenciesOf(name);
    } catch (e) {
      throw PluginError(`Cyclic dependency detected in "${name}": ${e.message}`);
    }

    delete this.depGraph;

    Object.defineProperties(this, {
      dependencies: {
        get() {
          return depGraph.dependenciesOf(name);
        },
        enumerable: true,
        configurable: true
      },
      name: {
        value: name,
        enumerable: true,
        configurable: true
      },
      version: {
        value: name,
        enumerable: true,
        configurable: true
      },
      originalDependencies: {
        value: deps,
        configurable: true
      },
      depGraph: {
        value: depGraph,
        configurable: true
      }
    });

    this.emit('did-use');
  },
  methods: {
    toJSON() {
      return _(this)
        .pick('name', 'version')
        .assign({dependencies: this.originalDependencies})
        .value();
    },
    install() {
      if (!this.installed) {
        this.emit('will-install');
        this.func(this.api, this.opts);
        this.emit('did-install');
      } else {
        this.emit('already-installed');
      }
      return this;
    },
    installWhenReady(missingDeps) {
      const dep = missingDeps.shift();
      this.api.once(`did-install:${dep}`, () => {
        if (!missingDeps.length) {
          this.install();
        } else {
          this.installWhenReady(missingDeps);
        }
      });
    }
  }
})
  .compose(EventEmittable)
  .once('did-install', function onceLoad() {
    this.installed = true;
  });

module.exports = Plugin;
