'use strict';

import stampit from 'stampit';
import {FSM, Graphable, EventEmittable} from '../core';

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
  .compose(FSM, EventEmittable)
  .initial('idle')
  .final('installed')
  .events({
    name: 'install',
    from: 'idle',
    to: 'installed'
  })
  .callback('install', function install (opts) {
    this.func(this.api, this.opts);
    return opts;
  });

export default Plugin;
export {default as Pluggable} from './pluggable';
