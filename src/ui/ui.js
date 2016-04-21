import stampit from 'stampit';
import Suite from './suite';
import Test from './test';
import {Decoratable, EventEmittable} from '../core';
import {SuiteRunner} from '../runner';
import is from 'check-more-types';

const UI = stampit({
  static: {
    suiteRunner: SuiteRunner(),
    enqueueSuite (suite) {
      this.suiteRunner.enqueue(suite);
    }
  },
  refs: {
    recursive: true
  },
  methods: {
    createSuite (suiteDef = {}, opts = {}) {
      const suite = this.Suite(suiteDef);
      if (opts.only) {
        this.addOnly(suite);
      }
      this.factory.enqueueSuite(suite);
      return suite;
    },
    createTest (testDef = {}, opts = {}) {
      const test = this.Test(testDef);
      if (opts.only) {
        this.addOnly(test);
      }
      return test;
    },
    addOnly (obj) {
      this.delegate.addOnly(obj);
      return this;
    },
    removeOnly (obj) {
      this.delegate.removeOnly(obj);
      return this;
    },
    addSkipped (obj) {
      this.delegate.addSkipped(obj);
      return this;
    },
    removeSkipped (obj) {
      this.delegate.removeSkipped(obj);
      return this;
    },
    retries (num) {
      this.context.retries(num);
      return this;
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
      const context = this.context = suite.context.spawn();

      this.Suite = Suite.refs({
        parent: suite,
        context
      })
        .once('will-run', suite => this.setContext(suite));

      if (this.recursive) {
        this.Suite =
          this.Suite.once('did-run',
            suite => this.setContext(suite.parent));
      }

      this.Test = Test.refs({parent: suite});
    }
  },
  init ({stamp}) {
    this.factory = stamp;
    if (is.not.object(this.rootSuite)) {
      throw new Error('UI() expects a "rootSuite" property');
    }
    this.setContext(this.rootSuite);
  }
})
  .compose(EventEmittable, Decoratable);

export default UI;
