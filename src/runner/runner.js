import stampit from 'stampit';
import {Decoratable, EventEmittable} from '../core';

const Runner = stampit({
  methods: {
    run (executable, opts = {}) {
      return executable.execute(opts);
    }
  },
  init () {
    this.onBroadcast('suite:created', (suite, opts = {}) => {
      if (opts.skip) {
        return this.emit('suite:skipped', suite);
      }
      this.emit('suite', suite);
    });
  }
})
  .compose(EventEmittable, Decoratable);

export default Runner;
