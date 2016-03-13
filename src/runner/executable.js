'use strict';

import stampit from 'stampit';
import is from 'check-more-types';
import {Unique} from '../core';
import results from './results';
import {last} from 'lodash/fp';
import executionContext from './execution-context';

const Executable = stampit({
  refs: {executionContext},
  init () {
    if (is.not.object(this.suite)) {
      throw new Error('Missing "suite" property');
    }

    // this is intended to be "sticky".  if you set it, then you
    // must unset it if you want to run anything.  if the function is missing,
    // "pending" is *implied* via the getter.
    let pending = this.pending;

    Object.defineProperties(this, {
      pending: {
        get () {
          return Boolean(this.suite.pending ||
            pending ||
            is.not.function(this.func));
        },
        set (value) {
          pending = Boolean(value && is.function(this.func));
        }
      }
    });
  },
  methods: {
    execute (opts) {
      return new Promise(resolve => {
        if (this.pending) {
          return resolve(results.skipped()
            .abort());
        }

        const func = this.func;
        this.async = Boolean(func.length);

        this.executionContext.enable({
          onAddTask: () => this.async = true,
          onError (...args) {
            resolve(results.async()
              .complete(last(args)));
            return true;
          }
        });

        let retval;

        try {
          retval =
            executionContext.run(func,
              this.suite.context,
              err => resolve(results.userCallback()
                .complete(err)));
        } catch (err) {
          return resolve(results.sync()
            .complete(err));
        }

        if (is.object(retval) && is.function(retval.then)) {
          const result = results.promise();
          retval
            .then(() => resolve(result.complete()),
              err => resolve(result.complete(err)));
        } else if (!this.async) {
          resolve(results.sync()
            .complete());
        }
      })
        .catch(err => {
          return results.error()
            .abort(err);
        })
        .then(result => {
          this.executionContext.disable();
          return Object.assign(opts, {result});
        });
    }
  }
})
  .compose(Unique);

export default Executable;
