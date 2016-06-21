import stampit from 'stampit';
import {reduce} from 'lodash/fp';
import moment from 'moment';
import errorist from 'errorist';

const resultTypes = [
  'pending',
  'error',
  'sync',
  'callback',
  'promise'
];

const Result = stampit({
  init () {
    Object.defineProperties(this, {
      hasCallback: {
        get () {
          return this.fulfilled === 'callback';
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
      this.elapsed = moment().diff(this.startTime);
      delete this.startTime;
      Object.freeze(this);
      return this;
    },
    complete (err, isOperational = false) {
      if (this.fulfilled !== 'pending') {
        if (err) {
          if (this.fulfilled === 'callback') {
            this.isOperational = isOperational;
          }
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
