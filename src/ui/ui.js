import stampit from 'stampit';
import {Decoratable, EventEmittable, Stateful} from '../core';
import {assign, constant, get, curry} from 'lodash/fp';
import Suite, {rootSuite} from './suite';
import Test from './test';
import Hook from './hook';
import {fromEvents, Kefir} from 'kefir';

const UI = stampit({
  refs: {
    // XXX not sure how to deal with this yet, or if it's necessary
    // think : QUnit ui
    recursive: true
  },
  methods: {
    withParentSuite (definition) {
      return assign(definition, {parent: this.delegate.suite});
    },
    createSuite (definition = {}) {
      this.emit('suite:create', this.withParentSuite(definition));
      return this;
    },
    createTest (definition = {}) {
      this.emit('test:create', this.withParentSuite(definition));
      return this;
    },
    retries (num) {
      this.context.retries(num);
      return this;
    },
    afterTests (definition = {}) {
      this.emit('hook:create',
        this.withParentSuite(assign(definition, {kind: 'post'})));
      return this;
    },
    beforeTests (definition = {}) {
      this.emit('hook:create',
        this.withParentSuite(assign(definition, {kind: 'pre'})));
      return this;
    },
    afterEachTest (definition = {}) {
      this.emit('hook:create',
        this.withParentSuite(assign(definition, {kind: 'post-each'})));
      return this;
    },
    beforeEachTest (definition = {}) {
      this.emit('hook:create',
        this.withParentSuite(assign(definition, {kind: 'pre-each'})));
      return this;
    }
  },
  init () {
    // this.currentSuite$ = this.runningSuite$.toProperty(constant(Suite.root));
    //
    // this.childSuite$ = Kefir.pool();
    // this.childSuite$.filter(isExcluded)
    //   .combine(this.currentSuite$,
    //     (Factory, parent) => Factory({parent}));
    //
    // this.executable$ = Kefir.pool();
    // TODO: the idea here would be to stall instantiation until we're
    // sure there is no inclusive filter used.  if one is used, then we
    // can go ahead and instantiate the applicable ones.  I think once
    // the currentSuite$ returns to the Root (if it left; otherwise wait
    // until run()), and no inclusive suites have shown up, then we can
    // instantiate.
    // seems like a pain in the ass but might save a fair amount of memory.
    // this.executable$.filter(isExcluded)
    //   .combine(this.currentSuite$,
    //     // this function can be executed when we're ready
    //     (Factory, parent) => parent.createChild.bind(parent, Factory))

    // const inclusive$ = executable$.filter(isInclusive);
  }
})
  .compose(EventEmittable, Decoratable)
  .init(function initState () {
    const emitSuite = suite => {
      this.emit('suite', suite);
    };

    const createSuite$ = fromEvents(this, 'suite:create');
    const runnableSuite$ = createSuite$.reject(get('excluded'))
      .map(Suite);

    runnableSuite$.onValue(emitSuite);

    const createTest$ = fromEvents(this, 'test:create');
    const runnableTest$ = createTest$.reject(get('excluded'))
      .map(Test);

    this.runnable$.plug(runnableSuite$);

    this.delegate.on('run', () => {
      console.log('run');
      runnableSuite$.offValue(emitSuite);
      this.runnable$.unplug(runnableSuite$);
      this.runnable$.plug(runnableTest$);
    });
  });

export default UI;
