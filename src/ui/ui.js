import stampit from 'stampit';
import {Decoratable, EventEmittable, Streamable} from '../core';
import {Kefir} from 'kefir';
import {assign, constant, curry} from 'lodash/fp';
import Suite from './suite';
import Test from './test';
import Hook from './hook';
import is from 'check-more-types';

const UI = stampit({
  refs: {
    recursive: true
  },
  methods: {
    /**
     * @private
     */
    write: curry(function write (pool, value) {
      pool.plug(Kefir.constant(value));
      return this;
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
    afterTests (definition = {}, opts = {}) {
      this.createExecutable(Hook, definition, assign(opts, {
        hooks: 'post'
      }));
      return this;
    },
    beforeTests (definition = {}, opts = {}) {
      this.createExecutable(Hook, definition, assign(opts, {
        hooks: 'pre'
      }));
      return this;
    },
    afterEachTest (definition = {}, opts = {}) {
      this.createExecutable(Hook, definition, assign(opts, {
        hooks: 'postEach'
      }));
      return this;
    },
    beforeEachTest (definition = {}, opts = {}) {
      this.createExecutable(Hook, definition, assign(opts, {
        hooks: 'preEach'
      }));
      return this;
    }
  },
  init () {
    const dynamo$ = this.dynamo$ = Kefir.pool();
    const suite$ = this.suite$ = Kefir.pool();
    const currentSuite$ = suite$.toProperty(() => Suite.root);
    const writeExecutable = this.write(this.delegate.executable$);

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

    suite$.onValue(setContext);

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
      executable: Factory({
        parent,
        context: parent.spawnContext()
      }),
      opts
    }))
      .onValue(({executable}) => writeExecutable(executable));

    // XXX: here we're just sending the test off to the runner
    // to ostensibly run later.  each Suite has a reference to the hooks
    // which need to be run, which may not actually be necessary.
    // note that currently, the Suite does NOT have a reference to its
    // tests, because that doesn't (yet) seem necessary.
    executing$.filter(({executable}) => is.test(executable))
      .map(({executable}) => executable)
      .onValue(test => {
        this.emit('ui:test', test);
      });

    executing$.filter(({executable}) => is.hook(executable))
      .onValue(({executable, opts}) => {
        currentSuite$.onValue(suite => {
          // XXX: I don't like the tight coupling here.
          suite[opts.hooks].push(executable);
        });
        this.emit('ui:hook', executable);
      });

    executing$.filter(({executable}) => is.suite(executable))
      .map(({executable}) => executable)
      .onValue(suite => {
        this.emit('ui:suite', suite);
      })
      .flatMap(suite => suite.eventStream('suite:execute:begin')
        .take(1)
        .map(constant(suite)))
      .onValue(setCurrentSuite)
      .flatMap(suite => suite.eventStream('suite:execute:end')
        .take(1)
        .map(constant(suite.parent)))
      .onValue(setCurrentSuite);

    // begin by plugging the root Suite into the stream, so it
    // becomes current, and the context is set.
    setCurrentSuite(Suite.root);
  }
})
  .compose(EventEmittable, Decoratable, Streamable);

export default UI;
