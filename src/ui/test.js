'use strict';

import stampit from 'stampit';
import FSM from '../core/fsm';
import {isObject, isFunction, bindAll, last} from 'lodash';
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
    run () {
      Promise.resolve()
        .then(() => {
          return this.begin();
        })
        .catch(() => {
          return Promise.reject(new Error('Cannot rerun a passed test'));
        })
        .then(() => {
          if (this.state === 'skipped') {
            this.emit('result', resultTypes.skipped()
              .abort());
          }
        })
        .catch(err => {
          this.emit('result', resultTypes.error()
            .abort(err));
        });

      // TODO maybe hook into the timeout here.
      return this.waitOn('result', {timer: true})
        .then(([elapsed, result]) => {
          if (result.aborted && result.error) {
            return Promise.reject(result.error);
          }
          return Object.assign(result, {elapsed});
        });
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
    const syncResult = resultTypes.sync();
    const callbackResult = resultTypes.callback();

    const executionState = {
      test: this,
      async: false,
      id: this.id,
      done (result, err = null) {
        executionContext.destroy();
        const test = this.test;
        if (err) {
          return test.fail(result.complete(err));
        }
        test.pass(result.complete());
      },
      onAddTask () {
        this.async = true;
      },
      onError (...args) {
        const err = last(args);
        this.done(callbackResult, err);
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
          executionState.done.bind(executionState, callbackResult));
    } catch (err) {
      return executionState.done(syncResult, err);
    }
    if (isObject(retval) && isFunction(retval.then)) {
      const promiseResult = resultTypes.promise();
      retval.then(() => executionState.done(promiseResult),
        executionState.bind(executionState, promiseResult));
    } else if (!executionState.async) {
      executionState.done(syncResult);
    }
  })
  .on('failed', function onFailed (result) {
    this.emit('fail', result.failed);
    this.emit('result', result);
  })
  .on('passed', function onPassed (result) {
    this.emit('pass');
    this.emit('result', result);
  })
  .on('skipped', function onSkipped () {
    this.emit('skip');
  })
  .on('result', function onResult (result) {
    this.results.push(result);
  });

export default Test;
