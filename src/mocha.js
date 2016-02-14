'use strict';

import stampit from 'stampit';
import {Pluggable} from './plugins';
import UI, {Suite} from './ui';
import Reporter from './reporter';
import {defaults} from 'lodash';
import pkg from './options/package';

const Mocha = stampit({
  refs: {
    ui: 'bdd',
    exposeGlobals: true
  },
  props: {
    reporters: []
  },
  static: {pkg},
  methods: {
    createAPI(API, opts = {}) {
      defaults(opts, {
        delegate: this
      });
      return API(opts);
    },
    createUI(opts = {}) {
      defaults(opts, {
        rootSuite: this.rootSuite
      });
      return this.createAPI(UI, opts);
    },
    createReporter(opts = {}) {
      return this.createAPI(Reporter, opts);
    },
    createRunner(opts = {}) {
      defaults(opts, {
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
    this.emit('init');
  });

export default Mocha.refs({Mocha});
