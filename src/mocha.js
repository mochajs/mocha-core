'use strict';

import stampit from 'stampit';
import Pluggable from './core/pluggable';
import UI, {Suite} from './ui';
import Reporter from './reporter';
import _ from 'lodash';
import bdd from 'mocha-ui-bdd';

const Mocha = stampit({
  refs: {
    ui: bdd,
    reporters: []
  },
  methods: {
    createAPI(API, opts = {}) {
      _.defaults(opts, {
        delegate: this
      });
      return API(opts);
    },
    createUI(opts = {}) {
      _.defaults(opts, {
        rootSuite: this.rootSuite
      });
      return this.createAPI(UI, opts);
    },
    createReporter(opts = {}) {
      return this.createAPI(Reporter, opts);
    },
    createRunner(opts = {}) {
      _.defaults(opts, {
        rootSuite: this.rootSuite
      });
      // return this.createAPI(Runner, opts);
    },
    run() {
      this.emit('pre-run', this);
    }
  },
  init() {
    this.rootSuite = Suite();
  }
})
  .compose(Pluggable)
  .init(function initMochaPlugins() {
    this.use(this.ui);
  });

export default Mocha.refs({Mocha});
