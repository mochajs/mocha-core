import stampit from 'stampit';
import Suite from './suite';
import Test from './test';
import {Decoratable, EventEmittable} from '../core';

const UI = stampit({
  refs: {
    recursive: true,
    rootSuite: Suite()
  },
  methods: {
    createSuite (suiteDef = {}, opts = {}) {
      const suite = this.Suite(suiteDef);
      this.broadcast('suite:created', suite, opts);
      return suite;
    },
    createTest (testDef = {}, opts = {}) {
      const test = this.Test(testDef);
      this.broadcast('test:created', test, opts);
      return test;
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
    setContext (suite) {
      // if the UI needs to work with the context object, this is it.
      this.context = suite.context;

      // redefine the Suite stamp so that it has a reference to the
      // parent.  `this.Suite()` is called only if there's a nested
      // Suite created via `this.createSuite()`.
      // if aSsuite was created, and when the "will-execute" event is emitted,
      // we need to redefine `this.Suite()` yet again.  when the Suite is done
      // executing, we reset the context to the suite's parent.
      // this behavior prevents us from having to keep a stack around.
      this.Suite = Suite.refs({parent: suite})
        .init(({instance}) => {
          // only spawn a new context if we actually create a suite
          instance.context = suite.spawnContext();

          instance.once('will-execute', suite => this.setContext(suite));
          instance.once('did-execute', suite => this.setContext(suite.parent));
        });

      this.Test = Test.refs({parent: suite});
    }
  },
  init () {
    this.setContext(this.rootSuite);
  }
})
  .compose(EventEmittable, Decoratable);

export default UI;
