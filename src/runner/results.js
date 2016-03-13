'use strict';

import stampit from 'stampit';
import {omitBy, flow, map, fromPairs} from 'lodash/fp';
import is from 'check-more-types';

const resultTypes = [
  'skipped',
  'error',
  'sync',
  'async',
  'userCallback',
  'promise'
];

const Result = stampit({
  static: {
    fulfilledWith (fulfilled) {
      return Result.props({fulfilled});
    }
  },
  props: {
    completed: false,
    aborted: false,
    failed: null,
    error: null,
    skipped: null,
    async: null,
    explicit: false,
    event: null
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
      this.event = this.failed ? 'fail' : 'pass';
      this.error = err;
      return this.cleanup();
    },
    abort (err) {
      this.aborted = true;
      this.error = err;
      this.skipped = !err;
      this.event = this.skipped ? 'skip' : 'error';
      return this.cleanup();
    },
    toJSON () {
      return flow(omitBy(is.null),
        omitBy(is.not.defined),
        omitBy(is.function))(
        this);
    },
    toString () {
      return JSON.stringify(this);
    }
  }
});

const results = flow(map(value => [
  value,
  Result.fulfilledWith(value)
]), fromPairs)(resultTypes);

export {Result, resultTypes};
export default results;
