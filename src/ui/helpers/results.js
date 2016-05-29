import stampit from 'stampit';
import {reduce, includes} from 'lodash/fp';
import moment from 'moment';
import errorist from 'errorist';

const resultTypes = [
  'pending',
  'error',
  'sync',
  'async',
  'userCallback',
  'promise'
];

const Result = stampit({
  init () {
    Object.defineProperties(this, {
      async: {
        get () {
          return includes(this.fulfilled, [
            'async',
            'userCallback',
            'promise'
          ]);
        }
      },
      passed: {
        get () {
          return !(this.aborted || this.failed);
        }
      }
    });
  },
  methods: {
    finalize () {
      delete this.startTime;
      this.elapsed = moment().diff(this.startTime);
      Object.freeze(this);
      return this;
    },
    complete (err) {
      if (this.fulfilled !== 'pending') {
        if (err) {
          this.failed = true;
          this.reason = err;
        } else {
          this.failed = false;
        }
      }
      return this.finalize();
    },
    abort (err) {
      this.error = errorist(err);
      return this.finalize();
    },
    toString () {
      return JSON.stringify(this);
    }
  }
});

export {Result, resultTypes};

function instrument () {
  const startTime = moment();
  return reduce((acc, fulfilled) => {
    Object.defineProperty(acc, fulfilled, {
      get () {
        return Result({fulfilled, startTime});
      }
    });
    return acc;
  }, {}, resultTypes);
}

export default instrument;
