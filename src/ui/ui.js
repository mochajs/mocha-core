import stampit from 'stampit';
import {Decoratable, EventEmittable, Streamable} from '../core';
import {Kefir} from 'kefir';
import {constant, curry} from 'lodash/fp';
import Suite from './suite';
import Test from './test';
import is from 'check-more-types';

const UI = stampit({
  refs: {
    recursive: true
  },
  methods: {
    write: curry(function write (pool, value) {
      pool.plug(Kefir.constant(value));
    }),
    createExecutable (Factory, definition = {}, opts = {}) {
      if (!Factory) {
        throw new Error('Factory function required');
      }
      this.write(this.dynamo$, {
        Factory: Factory.refs(definition),
        opts
      });
      return this;
    },
    createSuite (definition = {}, opts = {}) {
      this.createExecutable(Suite, definition, opts);
      return this;
    },
    createTest (definition = {}, opts = {}) {
      this.createExecutable(Test, definition, opts);
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

    }
  },
  init () {
    const dynamo$ = this.dynamo$ = Kefir.pool();
    const suite$ = this.suite$ = Kefir.pool();

    const writeExecutable = this.write(this.executable$);

    /**
     * Set the current suite by plugging it into the suite$ stream
     * @param {Suite} suite
     */
    const setCurrentSuite = suite => {
      suite$.plug(Kefir.constant(suite));
    };

    /**
     * Sets the context from a Suite.
     */
    const setContext = ({context}) => {
      this.context = context;
      this.emit('ui:context', context);
    };

    // summary:
    // - set the context when there's a new current suite
    // - if the new current suite is the root Suite, do nothing
    // - ostensibly the next current suite will be a child of the root suite,
    //   so we progress through the stream
    // - once we reach the root suite again, then the stream ends, and we
    //   emit `ui:suites:done`
    // ASSUMPTION: the root suite has one child suite.
    suite$.onValue(setContext)
      .skipWhile(executable => executable === Suite.root)
      .takeWhile(executable => executable !== Suite.root)
      .onEnd(() => {
        // this signifies that all suites have executed.
        this.emit('ui:suites:done');
      });

    // summary:
    // - get the current suite (`parent` param)
    // - instantiate the Executable with the `parent`
    // - plug into the executable$ pool for the runner to handle
    // - once the runner begins to execute a Suite, set it current
    // - once the execution is done, set the *parent* to current
    const executing$ = dynamo$.combine(suite$, ({Factory, opts}, parent) => ({
      // HEADS UP! this is where the actual Executable object is
      // instantiated.  it doesn't matter if it's a Test or a Suite
      // or a Hook at this point.
      executable: Factory.refs({parent})
        .create(),
      opts
    }))
      .onValue(({executable}) => writeExecutable(executable));

    executing$.filter(({executable}) => is.suite(executable))
      .map(({executable}) => executable)
      .flatMap(suite => suite.eventStream(
        'suite:execute:begin')
        .take(1)
        .map(constant(suite)))
      .onValue(setCurrentSuite)
      .flatMap(suite => suite.eventStream(
        'suite:execute:end')
        .take(1)
        .map(constant(suite.parent)))
      .onValue(setCurrentSuite);

    // begin by plugging the root Suite into the stream, so it
    // becomes current, and the context is set.
    setCurrentSuite(Suite.root);
  }
})
  .compose(EventEmittable, Decoratable, Streamable);
// .init(function initRootSuite () {
// })
// .init(function initSuiteMaker () {
//   const suites = this.suites;
//   const emitCreate = ({suite, opts}) => this.emit('suite:create', suite,
//     opts);
//   this.suiteMaker = Kefir.fromEvents(this, 'ui:suite:create')
//     .combine(this.parentSuite, ({suiteDef, opts}, parent) => {
//       return {
//         suite: Suite.refs({parent})
//           .once('execute:begin', function onExecuteBegin () {
//             suites.plug(Kefir.constant(this));
//           })
//           .once('execute:end', function onExecuteEnd () {
//             suites.plug(Kefir.constant(this.parent));
//           })
//           .create(suiteDef),
//         opts
//       };
//     })
//     .onValue(emitCreate);
//   this.on('suites:done', () => this.suiteMaker.offValue(emitCreate));
// })
// .init(function initTestMaker () {
//   const emitCreate = ({test, opts}) => this.emit('test:create', test,
// opts); this.testMaker = Kefir.fromEvents(this, 'ui:test:create')
// .combine(this.parentSuite, ({testDef, opts}, parent) => { return { test:
// Test.refs({parent}) .create(testDef), opts }; }) .onValue(emitCreate);
// this.on('suites:done', () => this.testMaker.offValue(emitCreate)); });

export default UI;
