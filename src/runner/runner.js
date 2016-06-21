import {EventEmittable} from '../core';
import stampit from 'stampit';
import {fromEvents} from 'kefir';

const Runner = stampit({
  init () {
  },
  methods: {
    run (executable) {
      this.emit('run', executable);
    }
  }
})
  .compose(EventEmittable)
  .init(function initEvents () {
    const running$ = fromEvents(this, 'run');

    running$.flatMap(executable => executable.result$)
      .onValue(result => {
        this.emit('result', result);
      });

    this.running$.plug(running$.merge(
      running$.flatMap(executable => executable.execute())
        .map(executable => executable.parent)));

    this.runnable$.onValue(runnable => {
      this.emit('runnable', runnable);
    });
  });

export default Runner;
