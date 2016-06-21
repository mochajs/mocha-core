import stampit from 'stampit';
import {FSM, Taggable} from '../core';
import Executable from './executable';

const Test = stampit({
})
  .compose(FSM, Taggable, Executable)
  .initial('idle')
  .final('passed', 'errored')
  .events({
    name: 'incomplete',
    from: [
      'idle',
      'running'
    ],
    to: 'pending'
  }, {
    name: 'run',
    from: [
      'idle',
      'failed',
      'pending'
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
  .callback('enteredRunning', function enteredRunning (opts) {
    return this.execute(opts)
      .then(result => {
        opts.res = result;
        if (result.fulfilled === 'pending') {
          return this.incomplete();
        } else if (!result.error) {
          return result.failed ? this.fail() : this.pass();
        }
        return this.error(result.error || new Error('Unknown error!'));
      });
  });

export default Test;
