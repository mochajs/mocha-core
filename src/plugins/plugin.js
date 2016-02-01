'use strict';

import stampit from 'stampit';
import FSM from './../core/fsm';
import _ from 'lodash';

const Plugin = stampit({
  props: {
    installed: false
  },
  init() {
    const depGraph = this.depGraph;
    const name = this.name;
    depGraph.addNode(name);
    const deps = [].concat(this.dependencies || []);
    _.forEach(_.reject(deps, dep => depGraph.hasNode(dep)),
      dep => depGraph.addNode(dep));

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
      return this.ready();
    }

    let remaining = _.size(missingDeps);
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
