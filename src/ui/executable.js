import stampit from 'stampit';
import is from 'check-more-types';
import {Unique, EventEmittable, Streamable, typed} from '../core';
import instrument from './helpers/results';
import {once} from 'lodash';
import * as executionContext from './helpers/execution-context';
import Context from './context';
import {setImmediate, Promise} from '../util';
import errorist from 'errorist';

const Executable = stampit({
  refs: {
    context: Context()
  },
  props: {
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

      this.emit('execute:begin', this);

      return new Promise(resolve => {
        if (this.pending) {
          return resolve(results.pending.complete());
        }

        let isAsync = false;

        executionContext.enable({
          onAsync: once(function onAsync () {
            isAsync = true;
          }),
          onError: once(function onError (...args) {
            const err = args.pop();
            setImmediate(resolve.bind(null, results.async.complete(err)));
            return true;
          })
        });

        let retval;

        try {
          retval =
            executionContext.run(func,
              this.context.withExecutable(func),
              err => resolve(results.userCallback.complete(err)));
        } catch (err) {
          return resolve(results.sync.complete(err));
        }

        if (is.promise(retval)) {
          const result = results.promise;
          retval
            .then(() => resolve(result.complete()),
              err => resolve(result.complete(errorist(err))));
        } else if (!isAsync) {
          resolve(results.sync.complete());
        }
      })
        .catch(err => {
          return results.error.abort(err);
        })
        .then(result => {
          executionContext.disable();
          this.lastResult = result;
          this.results.push(result);
          this.emit('execute:end', result);
          return result;
        });
    }
  }
})
  .compose(EventEmittable, Unique, Streamable, typed('Executable'));

export default Executable;
