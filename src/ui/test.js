'use strict';

import errorist from 'errorist';
import stampit from 'stampit';
import FSM from '../core/fsm';
import {isObject, isFunction, bindAll, last, curry} from 'lodash';
import {Taggable, Unique} from '../core/base';
import createExecutionContext from '../util/execution-context';
import {resultTypes} from './result';

const Test = stampit({
  props: {
    results: []
  },
  init () {
    if (!isObject(this.suite)) {
      throw new Error('Missing "suite" property');
    }

    this.suite.addTest(this);

    const func = this.func;

    Object.defineProperties(this, {
      pending: {
        get () {
          return this.suite.pending || !isFunction(this.func);
        },
        set (value) {
          if (isFunction(this.func)) {
            if (value) {
              this.func = null;
            }
          } else if (!value) {
            this.func = func;
          }
        }
      }
    });
  },
  methods: {
    debug() {
      console.error(`Test "${this.title}" [${this.id}] completed with results: ${this.results.map(res => String(res))}`);
    },
    run () {
      try {
        this.begin();
      } catch (err) {
        return Promise.reject(err);
      }
      // TODO maybe hook into the timeout here.
      return this.waitOn('done');
    }
  }
})
  .compose(Unique, FSM, Taggable)
  .initialState('idle')
  .states({
    idle: {
      begin: 'ready'
    },
    ready: {
      skip: 'skipped',
      execute: 'running'
    },
    skipped: {
      begin: 'ready'
    },
    running: {
      pass: 'passed',
      fail: 'failed'
    },
    passed: {},
    failed: {
      begin: 'ready'
    }
  })
  .on('ready', function onReady () {
    if (this.pending) {
      return this.skip();
    }
    this.execute();
  })
  .on('running', function onRunning () {
    const executionState = {
      test: this,
      async: false,
      id: this.id,
      done (result, err = null) {
        executionContext.destroy();
        this.test.results.push(result.fulfill(err));
        this.test.debug();
        if (err) {
          return this.test.fail(err);
        }
        return this.test.pass();
      },
      onAddTask () {
        this.async = true;
      },
      onError (...args) {
        const err = last(args);
        this.done(resultTypes.callback, err);
        return true;
      }
    };

    bindAll(executionState, [
      'onAddTask',
      'onError'
    ]);

    const executionContext = createExecutionContext({
      onAddTask: executionState.onAddTask,
      onError: executionState.onError
    });

    let retval;
    try {
      retval =
        executionContext.run(this.func,
          this.suite.context,
          executionState.done.bind(executionState, resultTypes.callback));
    } catch (err) {
      return executionState.done(resultTypes.sync, err);
    }
    if (retval && isFunction(retval.then)) {
      retval.then(() => executionState.done(resultTypes.promise),
        executionState.bind(executionState, resultTypes.promise));
    }

    if (!executionState.async) {
      executionState.done(resultTypes.sync);
    }
  })
  .on('failed', function onFailed (err) {
    this.emit('fail', errorist(err));
    this.emit('done', this);
  })
  .on('passed', function onPassed () {
    this.emit('pass');
    this.emit('done', this);
  })
  .on('skipped', function onSkipped () {
    this.emit('skip');
    this.emit('done', this);
  });

export default Test;
