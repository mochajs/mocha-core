import stampit from 'stampit';
import {FSM, Taggable} from '../core';
import Executable from './executable';
import {assign} from 'lodash';

const Test = stampit({
  methods: {
    doneRunning (opts) {
      const {result} = opts;
      this.results.push(result);
      this.emit('result', result);
      if (result.aborted && result.skipped) {
        return this.skip();
      } else if (!result.aborted) {
        return result.failed ? this.fail() : this.pass();
      }
      return this.error(result.error || new Error('Unknown error!'));
    }
  }
})
  .compose(FSM, Taggable, Executable)
  .initial('idle')
  .final('passed', 'errored')
  .events({
    name: 'skip',
    from: [
      'idle',
      'running'
    ],
    to: 'skipped'
  }, {
    name: 'run',
    from: [
      'idle',
      'failed',
      'skipped'
    ],
    to: 'running'
  }, {
    name: 'pass',
    from: 'running',
    to: 'passed'
  }, {
    name: 'fail',
    from: 'running',
    to: 'failed'
  }, {
    name: 'error',
    from: [
      'idle',
      'running'
    ],
    to: 'errored'
  })
  .callback('run', function run (opts) {
    assign(opts, {start: Date.now()});
  })
  .callback('enteredRunning', function enteredRunning (opts) {
    return this.execute(opts)
      .then(opts => {
        const {result} = opts;
        const elapsed = Date.now() - opts.start;
        opts.res = assign({elapsed}, result);
        return this.doneRunning(opts);
      });
  });

export default Test;
