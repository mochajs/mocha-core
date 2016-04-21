import stampit from 'stampit';
import {Kefir} from 'kefir';
import {EventEmittable} from '../core';

const SuiteRunner = stampit({
  init () {
    this.suites = Kefir.stream(emitter => {
      this.emitter = emitter;
    })
      .flatMapConcat(suite => {
        const promise = suite.run();
        return Kefir.fromPromise(promise);
      })
      .log();
  },
  methods: {
    enqueue (suite) {
      this.emitter.emit(suite);
      return this;
    }
  }
}).compose(EventEmittable);

export default SuiteRunner;
