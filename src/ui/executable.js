import stampit from 'stampit';
import is from 'check-more-types';
import {Unique} from '../core';
import results from './helpers/results';
import {once, assign} from 'lodash';
import * as executionContext from './helpers/execution-context';
import Context from './context';
import {setImmediate, Promise} from '../util';

const Executable = stampit({
  refs: {
    context: Context()
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
    execute (opts = {}) {
      const func = this.func;

      return new Promise(resolve => {
        if (!opts.force && this.pending) {
          return resolve(results.skipped.abort());
        }
        let async;

        executionContext.enable({
          onAsync: once(function onAsync () {
            async = true;
          }),
          onError: once(function onError (...args) {
            const err = args.pop();
            setImmediate(resolve.bind(null,
              results.async.complete(err)));
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
              err => resolve(result.complete(err)));
        } else if (!async) {
          resolve(results.sync.complete());
        }
      })
        .catch(err => {
          return results.error.abort(err);
        })
        .then(result => {
          executionContext.disable();
          opts.result = result;
          return assign(opts, {result});
        });
    }
  }
})
  .compose(Unique);

export default Executable;
