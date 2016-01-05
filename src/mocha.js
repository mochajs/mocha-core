'use strict';

const stampit = require('stampit');
const Pluggable = require('./core/pluggable');
const UI = require('./ui');
const Reporter = require('./reporter');
const Runner = require('./runner');
const Suite = require('./ui/suite');
const _ = require('lodash');

const Mocha = stampit({
  refs: {
    ui: require('mocha-ui-bdd')
  },
  methods: {
    run() {
    },
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
      return this.createAPI(Runner, opts);
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

module.exports = Mocha.refs({Mocha});
