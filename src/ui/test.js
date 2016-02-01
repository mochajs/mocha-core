'use strict';

import errorist from 'errorist';
import stampit from 'stampit';
import FSM from '../core/fsm';
import {isObject, isFunction} from 'lodash';
import {Taggable, Unique} from '../core/base';
import '../util/async-listener';

const Test = stampit({
  refs: {
    suite: null,
    async: false
  },
  init() {
    if (!isObject(this.suite)) {
      throw new Error('Missing "suite" property');
    }

    this.suite.addTest(this);

    const func = this.func;

    Object.defineProperties(this, {
      arity: {
        get() {
          if (isFunction(this.func)) {
            return this.func.length;
          }
          return null;
        }
      },
      pending: {
        get() {
          return this.suite.pending || !isFunction(this.func);
        },
        set(value) {
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
  }
})
  .compose(Unique, FSM, Taggable)
  .initialState('idle')
  .states({
    idle: {
      run: 'ready'
    },
    ready: {
      skip: 'skipped',
      execute: 'running'
    },
    skipped: {
      run: 'ready'
    },
    running: {
      pass: 'passed',
      fail: 'failed'
    },
    passed: {},
    failed: {
      run: 'ready'
    }
  })
  .init(function initRun() {
    const run = this.run;
    this.run = function runAndFulfill(...data) {
      const finished = new Promise((resolve, reject) => {
        this.once('skipped', resolve)
          .once('passed', resolve)
          .once('failed', reject);
      });
      run(...data);
      return finished;
    };
  })
  .on('ready', function onReady() {
    if (this.pending) {
      return this.skip();
    }
    this.execute();
  })
  .on('running', function onRunning() {
    const storage = {
      test: this,
      async: false,
      id: this.id
    };

    function done(storage, err) {
      process.removeAsyncListener(listener);
      if (err) {
        storage.test.fail(errorist(err));
      } else {
        storage.test.pass();
      }
    }

    const done2 = done.bind(null, storage);

    const listener = process.addAsyncListener({
      create(storage) {
        storage.async = true;
      },
      before(ctx, storage) {
      },
      error(storage, err) {
        done(storage, err);
        return true;
      }
    }, storage);

    let retval;
    try {
      retval = listener.run(this.func, this.suite.context, done2);
    } catch (err) {
      done2(err);
    }
    if (retval && isFunction(retval.then)) {
      retval.then(() => done());
    } else if (!storage.async) {
      done2();
    }
  })
  .on('failed', function onFailed(err) {
    this.emit('fail', err);
  })
  .on('passed', function onPassed() {
    this.emit('pass');
  });

export default Test;
