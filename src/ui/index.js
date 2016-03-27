import stampit from 'stampit';
import Suite from './suite';
import Test from './test';
import {Decoratable, EventEmittable} from '../core';

const UI = stampit({
  refs: {
    recursive: true
  },
  methods: {
    createSuite (suiteDef) {
      return this.Suite(suiteDef);
    },
    createTest (testDef) {
      return this.Test(testDef);
    },
    afterTests () {

    },
    beforeTests () {

    },
    afterEachTest () {

    },
    beforeEachTest () {

    },
    ignoreSuite () {

    },
    ignoreTest () {

    },
    setContext (suite) {
      this.Suite = Suite.refs({parent: suite})
        .once('execute:pre', suite => this.setContext(suite));

      if (this.recursive) {
        this.Suite =
          this.Suite.once('execute:post',
            suite => this.setContext(suite.parent));
      }

      this.Test = Test.refs({suite});
    }
  },
  init () {
    this.setContext(this.rootSuite);
  }
})
  .compose(EventEmittable, Decoratable);

export default UI;
export {Suite, Test};
export {default as Executable} from './executable';
