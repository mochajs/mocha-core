import stampit from 'stampit';
import {Decoratable} from '../core';

const UI = stampit({
  refs: {
    // XXX not sure how to deal with this yet, or if it's necessary
    // think : QUnit ui
    recursive: true
  },
  methods: {
    createSuite (definition = {}, opts = {}) {
      return this.delegate.createSuite(definition, opts);
    },
    createTest (definition = {}, opts = {}) {
      return this.delegate.createTest(definition, opts);
    },
    retries (num) {
      this.context.retries(num);
      return this;
    },
    afterTests (definition = {}) {
    },
    beforeTests (definition = {}) {
    },
    afterEachTest (definition = {}) {
    },
    beforeEachTest (definition = {}) {
    }
  }
})
  .compose(Decoratable);

export default UI;
