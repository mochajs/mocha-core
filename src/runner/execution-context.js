'use strict';

import is from 'check-more-types';
import {noop, pick} from 'lodash/fp';
import stampit from 'stampit';
import {Singleton} from '../core';
import 'async-listener';

const getOpts = pick([
  'create',
  'error',
  'before',
  'after'
]);

const ExecutionContext = stampit({
  props: {
    listener: {},
    enabled: false
  },
  methods: {
    enable (opts = {}) {
      if (!this.enabled) {
        opts.create = opts.onAddTask;
        opts.error = opts.onError;
        opts.before = opts.onBeforeTask;
        opts.after = opts.onAfterTask;

        const listener = this.listener;
        if (is.empty(listener)) {
          this.listener = process.addAsyncListener(getOpts(opts));
        } else {
          this.disable();
          Object.assign(listener, opts);
        }

        this.enabled = true;
      }
      return this;
    },
    disable () {
      if (this.enabled) {
        const listener = this.listener;
        listener.error =
          listener.create = listener.before = listener.after = noop;
        this.enabled = false;
      }
      return this;
    },
    destroy () {
      this.disable();
      process.removeAsyncListener(this.listener);
      this.listener = {};
      return this;
    },
    run (func, context, ...args) {
      return func.apply(context, args);
    }
  }
}).compose(Singleton);

export {ExecutionContext};
const executionContext = ExecutionContext();
export default executionContext;
