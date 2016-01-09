'use strict';

import stampit from 'stampit';
import Suite from './suite';
import Test from './test';
import {Decoratable, EventEmittable} from '../core/base';

const UI = stampit({
  methods: {
    createSuite(suiteDef) {
      const suite = this.Suite(suiteDef);
      this.emit('will-execute-suite', suite);
      suite.execute();
      this.emit('did-execute-suite', suite);
      return suite;
    },
    createTest(testDef) {
      return this.Test(testDef);
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
    setContext(suite) {
      this.Suite = Suite.refs({parent: suite});
      this.Test = Test.refs({suite});
    }
  },
  init() {
    this.setContext(this.rootSuite);
  }
})
  .compose(EventEmittable, Decoratable)
  .on('will-execute-suite', function onWillExecuteSuite(suite) {
    this.setContext(suite);
  })
  .on('did-execute-suite', function onDidExecuteSuite(suite) {
    this.setContext(suite.parent);
  });

export default UI;
export {Suite, Test};
