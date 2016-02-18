'use strict';

import stampit from 'stampit';

const Result = stampit({
  methods: {
    fulfill (err) {
      this.error = err;
      this.pass = !err;
      return this;
    },
    toString () {
      return `${this.pass ? 'resolved' : 'rejected'} via "${this.fulfilled}" method`;
    }
  }
});

const resultTypes = {
  sync: Result({fulfilled: 'sync'}),
  callback: Result({fulfilled: 'callback'}),
  promise: Result({fulfilled: 'promise'})
};

export default Result;
export {resultTypes};
