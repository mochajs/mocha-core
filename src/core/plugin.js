'use strict';

const EventEmittable = require('./base/eventemittable');
const stampit = require('stampit');
const makeArray = require('../util/make-array');
const _ = require('lodash');
const FSM = require('./fsm');

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

    Object.defineProperty(this, 'installed', {
      get() {
        return this.state === 'installed';
      }
    });
  },
  methods: {
    install(missingDeps = []) {
      if (this.state !== 'idle') {
        return this;
      }

      this.emit('install', missingDeps);

      return this;
    }
  }
})
  .compose(FSM)
  .initialState('idle')
  .states({
    idle: {
      install: 'waiting'
    },
    waiting: {
      ready: 'installing'
    },
    installing: {
      done: 'installed'
    },
    installed: {}
  })
  .once('waiting', function(missingDeps) {
    if (_.isEmpty(missingDeps)) {
      return this.emit('ready');
    }

    let remaining = _.size(missingDeps);
    _.forEach(missingDeps, dep => {
      this.api.once(`did-install:${dep}`, () => {
        if (!--remaining) {
          this.emit('ready');
        }
      });
    });
  })
  .once('installing', function() {
    this.func(this.api, this.opts);
    this.emit('done');
  });

module.exports = Plugin;
