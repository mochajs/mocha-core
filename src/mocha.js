'use strict';

const stampit = require('stampit');
const API = require('./core/api');
const UI = require('./ui');
const Reporter = require('./reporter');
const debug = require('debug')('mocha:mocha');

const Mocha = stampit({
  refs: {
    ui: require('mocha-ui-bdd')
  },
  methods: {
    start() {

    },
    run() {
      this.emit('pre-run');
      return this.loadPlugins()
        .then(plugins => {
          debug(`Loaded plugins ${plugins}`);
          this.emit('ready');
        })
        .return(this);
    },
    createUI() {
      return UI({mocha: this});
    },
    createReporter() {
      return Reporter({mocha: this});
    },
    createAPI() {
      return API({mocha: this});
    }
  }
})
  .compose(API)
  .init(function initMocha({stamp}) {
    this.use(this.ui);
    this.Mocha = stamp;
  });

module.exports = Mocha;
