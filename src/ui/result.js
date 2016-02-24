'use strict';

import stampit from 'stampit';
import {omitBy, flow} from 'lodash/fp';
import isNull from 'lodash/fp/isNull';
import isUndefined from 'lodash/fp/isUndefined';
import isFunction from 'lodash/fp/isFunction';

const Result = stampit({
  props: {
    completed: false,
    aborted: false,
    failed: null,
    error: null,
    skipped: null,
    async: null
  },
  methods: {
    cleanup () {
      Object.freeze(this);
      return this.toJSON();
    },
    complete (err) {
      this.completed = true;
      this.async =
        this.fulfilled === 'callback' || this.fulfilled === 'promise';
      this.failed = Boolean(err);
      this.passed = !err;
      this.error = err;
      return this.cleanup();
    },
    abort (err) {
      this.aborted = true;
      this.error = err;
      this.skipped = !err;
      return this.cleanup();
    },
    toJSON () {
      return flow(omitBy(isNull),
        omitBy(isUndefined),
        omitBy(isFunction))(
        this);
    },
    toString () {
      return JSON.stringify(this);
    }
  }
});

const resultTypes = {
  skipped: Result.props({fulfilled: 'skipped'}),
  error: Result.props({fulfilled: 'error'}),
  sync: Result.props({fulfilled: 'sync'}),
  callback: Result.props({fulfilled: 'callback'}),
  promise: Result.props({fulfilled: 'promise'})
};

export default Result;
export {resultTypes};
