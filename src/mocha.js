'use strict';

const core = require('./core');
const stampit = require('stampit');

const Mocha = stampit({
  refs: {
    ui: 'bdd',
    reporter: 'spec'
  },
  props: {
    lib: {
      core: core,
      ui: require('./ui'),
      reporter: require('./reporter')
    }
  },
  methods: {
    run() {
      return this.load()
        .then(() => {
          this.debug('Ready...');
        });
    }
  },
  init() {
    this.use(require('./plugins/mocha-ui-bdd'))
      .use(require('./plugins/mocha-reporter-spec'));
  }
})
  .compose(core.API)
  .compose(core.EventEmittable)
  .compose(core.Debuggable);

module.exports = Mocha;
