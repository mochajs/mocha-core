import stampit from '../ext/stampit';
import is from 'check-more-types';
import {Unique, Stateful} from '../core';
import instrument from './helpers/results';
import {once} from 'lodash/fp';
import * as executionContext from './helpers/execution-context.cjs';
import Context from './context';
import {setImmediate, Promise} from '../util';
import errorist from 'errorist';
import {fromPromise} from '../ext/kefir';

const Executable = stampit({
  refs: {
    context: Context()
  },
  props: {
    hasCallback: false,
    results: []
  },
  init () {
    // this is intended to be "sticky".  if you set it, then you
    // must unset it if you want to run anything.  if the function is missing,
    // "pending" is *implied* via the getter.
    let pending = Boolean(this.pending);

    Object.defineProperties(this, {
      pending: {
        get () {
          if (this.parent === null) {
            return false;
          }
          return pending || this.parent.pending || is.not.function(this.func);
        },
        set (value) {
          pending = Boolean(value) && is.function(this.func);
        }
      }
    });
  },
  methods: {
    execute () {
      const func = this.func;
      const results = instrument();
      this.executing = true;

      return fromPromise(new Promise(resolve => {
        if (this.pending) {
          return resolve(results.pending.complete());
        }

        executionContext.enable({
          onError: once(function onError (...args) {
            const err = args.pop();
            setImmediate(resolve.bind(null, results.callback.complete(err)));
            return true;
          })
        });

        let retval;

        try {
          retval =
            executionContext.run(func,
              this.context.withExecutable(func),
              err => {
                resolve(results.callback.complete(err && errorist(err), true));
              });
        } catch (err) {
          return resolve(results.sync.complete(err));
        }

        if (is.promise(retval)) {
          const result = results.promise;
          retval
            .then(() => resolve(result.complete()),
              err => resolve(result.complete(errorist(err))));
        } else if (!this.hasCallback) {
          resolve(results.sync.complete());
        }
      })
        .catch(err => {
          return results.error.abort(err);
        })
        .then(result => {
          executionContext.disable();
          this.lastResult = result;
          this.executing = false;
          return this;
        }));
    }
  }
})
  .compose(Unique, Stateful)
  .initialState({
    executing: false,
    lastResult: null
  })
  .init(function initResults () {
    this.result$ = this.lastResult$.filter()
      .onValue(result => {
        this.results.push(result);
      });
  });

export default Executable;
