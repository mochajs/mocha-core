'use strict';

const stampit = require('stampit');
const Suite = require('./suite');
const EventEmittable = require('../core/base/eventemittable');
const Decoratable = require('../core/base/decoratable');

const UI = stampit({
  methods: {
    createSuite(suiteDef) {
      const suite = this.Suite(suiteDef);
      this.emit('will-execute-suite', suite);
      suite.execute();
      this.emit('did-execute-suite', suite);
      return suite;
    },
    createTest() {

    },
    afterTests() {

    },
    beforeTests() {

    },
    afterEachTest() {

    },
    beforeEachTest() {

    },
    ignoreSuite() {

    },
    ignoreTest() {

    },
    onlySuite() {

    },
    onlyTest() {

    },
    setSuiteContext(parent) {
      this.Suite = Suite.refs({parent});
    }
  },
  init() {
    this.setSuiteContext(this.rootSuite || Suite());
  }
})
  .compose(EventEmittable, Decoratable)
  .on('will-execute-suite', function onWillExecuteSuite(suite) {
    this.setSuiteContext(suite);
  })
  .on('did-execute-suite', function onDidExecuteSuite(suite) {
    this.setSuiteContext(suite.parent);
  });

module.exports = UI;
