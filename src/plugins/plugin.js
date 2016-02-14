'use strict';

import stampit from 'stampit';
import FSM from '../core/fsm';
import {size, isEmpty} from 'lodash';
import _ from 'highland';
import {remove} from '../util';

const removePkg = remove('pkg');

const Plugin = stampit({
  static: {
    normalize(func = {}) {
      const {attributes} = func;
      attributes.dependencies = _([].concat(attributes.dependencies || []));
      func.attributes =
        Object.assign({}, attributes.pkg, removePkg(attributes));
      return func;
    }
  },
  init() {
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
      get() {
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
  .once('waiting', function(missingDeps) {
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
  .once('installing', function() {
    this.func(this.api, this.opts);
    this.done();
  });

export default Plugin;
