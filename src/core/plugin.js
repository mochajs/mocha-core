'use strict';

const EventEmittable = require('./base/eventemittable');
const stampit = require('stampit');
const makeArray = require('../util/make-array');
const _ = require('lodash');

const Plugin = stampit({
  props: {
    installed: false
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
      throw new Error(`Cyclic dependency detected in "${name}": ${e.message}`);
    }

    delete this.depGraph;

    Object.defineProperties(this, {
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
      dependencies: {
        value: deps,
        enumerable: true,
        configurable: true
      },
      depGraph: {
        value: depGraph,
        configurable: true
      }
    });

    this.once('did-install', () => this.installed = true);
  },
  methods: {
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
      if (_.isEmpty(missingDeps)) {
        return this.install();
      }

      let remaining = _.size(missingDeps);
      _.forEach(missingDeps, dep => {
        this.api.once(`did-install:${dep}`, () => {
          if (!--remaining) {
            this.install();
          }
        });
      });

      return this;
    }
  }
})
  .compose(EventEmittable);

module.exports = Plugin;
