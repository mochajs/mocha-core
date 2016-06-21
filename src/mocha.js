import stampit from 'stampit';
import {Pluggable} from './plugins';
import {UI, rootSuite} from './ui';
import {Runner} from './runner';
import {Reporter} from './reporter';
import pkg from './options/package';
import {Kefir} from 'kefir';
import {assign} from 'lodash/fp';
import is from 'check-more-types';
import {Mappable, Stateful} from './core';

const Mocha = stampit({
  refs: {
    version: pkg.version,
    runnable$: Kefir.pool(),
    running$: Kefir.pool(),
    plugins: {}
  },
  methods: {
    createAPI (Factory, properties = {}) {
      if (is.not.function(Factory)) {
        throw new Error('Factory function required');
      }
      return Factory(assign({
        delegate: this
      }, properties));
    },
    createUI (properties = {}) {
      return this.createAPI(UI, assign(properties, {
        runnable$: this.runnable$
      }));
    },
    createRunner (properties = {}) {
      return this.createAPI(Runner, assign(properties, {
        runnable$: this.runnable$,
        running$: this.running$
      }));
    },
    createReporter (properties = {}) {
      return this.createAPI(Reporter, properties);
    },
    run () {
      this.running$.toProperty()
        .onValue(current => {
          if (current === rootSuite) {
            this.emit('run');
          }
        });
    }
  }
})
  .compose(Pluggable, Stateful)
  .initialState({
    suite: rootSuite
  })
  .init(function init () {
    this.runners = Mappable();
    this.plug(this.running$.map(running => ({suite: running})));
    this.use(this.ui)
      .use(this.runner);
  });

export default Mocha.refs({Mocha});
