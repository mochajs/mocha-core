'use strict';

import stampit from 'stampit';
import FSM from '../core/fsm';
import {size, isEmpty} from 'lodash';
import _ from 'highland';

const Plugin = stampit({
  props: {
    dependencies: []
  },
  init () {
    const {depGraph, name, dependencies} = this;

    depGraph.addNode(name);
    dependencies.filter(dep => !depGraph.hasNode(dep))
      .forEach(dep => depGraph.addNode(dep));
    dependencies.forEach(dep => depGraph.addDependency(name, dep));

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
      install: 'installing'
    },
    installing: {
      done: 'installed'
    },
    installed: {}
  })
  .once('installing', function onInstalling () {
    this.func(this.api, this.opts);
    this.done();
  });

export default Plugin;
export {default as Pluggable} from './pluggable';
export {default as loader} from './loader';
export {default as resolver} from './resolver';
