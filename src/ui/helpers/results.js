import stampit from 'stampit';
import {reduce, includes} from 'lodash/fp';

const resultTypes = [
  'skipped',
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
      Object.freeze(this);
      return this;
    },
    complete (err) {
      this.aborted = false;
      if (err) {
        this.failed = true;
        this.error = err;
      } else {
        this.failed = false;
      }
      return this.finalize();
    },
    abort (err) {
      this.aborted = true;
      if (err) {
        this.skipped = false;
        this.error = err;
      } else {
        this.skipped = true;
      }
      return this.finalize();
    },
    toString () {
      return JSON.stringify(this);
    }
  }
});

const results = reduce((acc, fulfilled) => {
  Object.defineProperty(acc, fulfilled, {
    get () {
      return Result({fulfilled});
    }
  });
  return acc;
}, {}, resultTypes);

export {Result, resultTypes};
export default results;
