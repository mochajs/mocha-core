'use strict';

const _ = require('lodash');
const stampit = require('stampit');
const Pluggable = require('./core/pluggable');
const UI = require('./ui');
const Reporter = require('./reporter');

const Mocha = stampit({
  refs: {
    ui: require('mocha-ui-bdd')
  },
  methods: {
    run() {
    },
    createUI() {
      return UI({mocha: this});
    },
    createReporter() {
      return Reporter({mocha: this});
    },
    expose(...prototypes) {
      _.forEach(prototypes, prototype => {
        _.mixin(this, prototype, {chain: false});
      });

      return this;
    }
  }
})
  .compose(Pluggable)
  .init(function initMocha() {
    this.use(this.ui);
  });

module.exports = Mocha;
