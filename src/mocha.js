import stampit from 'stampit';
import {Pluggable} from './plugins';
import {UI, Suite} from './ui';
import {Runner} from './runner';
import {Reporter} from './reporter';
import pkg from './options/package';
import {assign} from 'lodash/fp';
import is from 'check-more-types';
import {pool, constant} from 'kefir';

const Mocha = stampit({
  refs: {
    version: pkg.version,
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
      return this.createAPI(UI, properties);
    },
    createReporter (properties = {}) {
      return this.createAPI(Reporter, assign(properties, {
        runner: this.runner
      }));
    },
    createSuite (definition = {}, opts = {}) {
      const suite = this.currentSuite.createSuite(definition, opts);
      this.runner.enqueue(suite);
      return suite;
    },
    createTest (definition = {}, opts = {}) {
      return this.currentSuite.createTest(definition, opts);
    },
    run () {
      return this.runner.run();
    }
  }
})
  .compose(Pluggable)
  .init(function init () {
    const runner = this.runner = Runner({delegate: this});

    const rootSuite = Suite({
      root: true,
      title: 'ROOT SUITE',
      queue$: runner.queue$
    });

    this.currentSuite$ = pool();

    const currentSuiteProp$ = this.currentSuite$.toProperty(() => rootSuite);

    Object.defineProperty(this, 'currentSuite', {
      get () {
        let suite = null;
        currentSuiteProp$.onValue(currentSuite => {
          suite = currentSuite;
        });
        return suite;
      },
      set (suite) {
        this.currentSuite$.plug(constant(suite));
      }
    });

    this.use(this.ui);
    this.reporter = Reporter({runner: this.runner});
  });

export default Mocha.refs({Mocha});
