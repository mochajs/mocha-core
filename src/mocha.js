'use strict';

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
    }
  }
})
  .compose(Pluggable)
  .init(function initMocha({stamp}) {
    this.use(this.ui);
    this.Mocha = stamp;
  });

module.exports = Mocha;
