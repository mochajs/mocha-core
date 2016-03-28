import stampit from 'stampit';
import is from 'check-more-types';
import {Unique} from '../core';
import results from './helpers/results';
import {last} from 'lodash/fp';
import * as executionContext from './helpers/execution-context';

const Executable = stampit({
  init () {
    if (is.not.object(this.suite)) {
      throw new Error('Missing "suite" property');
    }

    // this is intended to be "sticky".  if you set it, then you
    // must unset it if you want to run anything.  if the function is missing,
    // "pending" is *implied* via the getter.
    let pending = Boolean(this.pending);

    Object.defineProperties(this, {
      pending: {
        get () {
          return Boolean(this.suite.pending) ||
            pending ||
            is.not.function(this.func);
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
        if (this.pending) {
          return resolve(results.skipped()
            .abort());
        }
        let async;

        executionContext.enable({
          name: this.title,
          onAsync () {
            async = true;
          },
          onError (...args) {
            const err = last(args);
            setImmediate(() => {
              resolve(results.async()
                .finish(err));
            });
            return true;
          }
        });

        let retval;

        try {
          retval =
            executionContext.run(func,
              this.suite.context,
              err => resolve(results.userCallback()
                .finish(err)));
        } catch (err) {
          return resolve(results.sync()
            .finish(err));
        }

        if (is.promise(retval)) {
          const result = results.promise();
          retval
            .then(() => resolve(result.finish()),
              err => resolve(result.finish(err)));
        } else if (!async) {
          resolve(results.sync()
            .finish());
        }
      })
        .catch(err => {
          return results.error()
            .abort(err);
        })
        .then(result => {
          executionContext.disable();
          return Object.assign(opts, {result});
        });
    }
  }
})
  .compose(Unique);

export default Executable;
