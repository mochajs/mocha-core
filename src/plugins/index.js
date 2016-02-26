'use strict';

import stampit from 'stampit';
import FSM from '../core/fsm';
import {size, isEmpty} from 'lodash';
import _ from 'highland';

const Plugin = stampit({
  init () {
    const {depGraph, name, dependencies} = this;

    depGraph.addNode(name);

    dependencies.observe()
      .each(dep => depGraph.addDependency(name, dep));

    dependencies.reject(dep => depGraph.hasNode(dep))
      .each(dep => depGraph.addNode(dep));

    try {
      depGraph.dependenciesOf(name);
    } catch (e) {
      throw new Error(`Cyclic dependency detected in "${name}": ${e.message}`);
    }

    Object.defineProperty(this, 'installed', {
      get () {
        return this.state === 'installed';
      }
    });
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
  .once('waiting', function onWaiting (missingDeps) {
    if (isEmpty(missingDeps)) {
      return this.ready();
    }

    let remaining = size(missingDeps);
    _.forEach(missingDeps, dep => {
      this.api.once(`did-install:${dep}`, () => {
        if (!--remaining) {
          this.ready();
        }
      });
    });
  })
  .once('installing', function onInstalling () {
    this.func(this.api, this.opts);
    this.done();
  });

export default Plugin;
export {default as Pluggable} from './pluggable';
export {default as loader} from './loader';
export {default as resolver} from './resolver';
