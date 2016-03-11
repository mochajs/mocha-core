'use strict';

import stampit from 'stampit';
import {Pluggable} from './plugins';
import UI, {Suite} from './ui';
import Reporter from './reporter';
import {defaults} from 'lodash';
import {API} from './core';

const Mocha = stampit({
  refs: {
    ui: 'bdd'
  },
  props: {
    reporters: []
  },
  methods: {
    createUI (opts = {}) {
      defaults(opts, {
        rootSuite: this.rootSuite
      });
      return this.createAPI(UI, opts);
    },
    createReporter (opts = {}) {
      return this.createAPI(Reporter, opts);
    // },
    // createRunner (opts = {}) {
    //   defaults(opts, {
    //     rootSuite: this.rootSuite
    //   });
    //   return this.createAPI(Runner, opts);
    // },
    // run () {
    //   this.emit('pre-run', this);
    }
  },
  init () {
    this.rootSuite = Suite();
  }
})
  .compose(Pluggable, API)
  .init(function initMochaPlugins () {
    this.use(this.ui);
  });

export default Mocha;
