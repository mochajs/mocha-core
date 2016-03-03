'use strict';

import stampit from 'stampit';
import {FSM, Graphable} from '../core';

const Plugin = stampit({
  props: {
    dependencies: []
  },
  init () {
    this.depGraph = this.depGraph || Graphable();
    const {depGraph, name, dependencies} = this;

    depGraph.addNode(name);
    dependencies.filter(dep => !depGraph.hasNode(dep))
      .forEach(dep => depGraph.addNode(dep));
    dependencies.forEach(dep => depGraph.addDependency(name, dep));

    try {
      depGraph.dependenciesOf(name);
    } catch (e) {
      this.emit('error',
        new Error(`Possible cyclic dependency detected in Plugin w/ name "${name}": ${e.message}`));
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
