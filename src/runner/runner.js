import {EventEmittable} from '../core';
import stampit from 'stampit';
import {stream} from 'kefir';
import {invoke, prop} from 'lodash/fp';

const isExcluded = prop('opts.excluded');

const Runner = stampit({
  init () {
    const queue$ = this.queue$ = stream(emitter => {
      this.queue = emitter;
      return () => {
        delete this.queue;
      };
    })
      .reject(isExcluded);

    queue$.observe({
      value: suite => {
        this.delegate.currentSuite = suite;
      }
    });

    queue$.flatMapConcat(suite => {
      suite.runnables$.observe({
        value: test => {
          this.emit('test', test);
        }
      });

      const testExecutor$ = suite.runnables$
        .flatMap(invoke('execute'));

      testExecutor$.observe({
        value: test => {
          this.emit('testEnd', test);
        }
      });

      return suite.execute()
        .map(suite => ({
          suite,
          testExecutor$
        }));
    })
      .bufferWhileBy(this.queue$)
      .flatten()
      .flatMap(({suite, testExecutor$}) => {
        this.emit('suite', suite);
        suite.runnables.end();
        return testExecutor$;
      })
      .observe({
        value: ({parent}) => {
          this.emit('suiteEnd', parent);
        },
        error: err => {
          this.emit('error', err);
        }
      });
  },
  methods: {
    enqueue (suite) {
      this.queue.emitEvent({
        type: 'value',
        value: suite
      });
    },
    run () {
      this.queue.end();
    }
  }
})
  .compose(EventEmittable);

export default Runner;
