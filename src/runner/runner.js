import {EventEmittable, Decoratable, Streamable} from '../core';
import stampit from 'stampit';
import is from 'check-more-types';
import {dereference, isInclusive, isExcluded} from './helpers';
import {
  overEvery, head, identity, negate, pipe, eq, get, curry
} from 'lodash/fp';

const Runner = stampit({
  init () {
    this.executable$ = this.delegate.executable$;
  }
})
  .compose(EventEmittable, Decoratable, Streamable)
  .init(function initRunnables () {
    const executable$ = this.executable$;
    const inclusive$ = this.inclusive$ = executable$.filter(isInclusive);
    this.excluded$ = executable$.filter(isExcluded);
    this.runnable$ = executable$.reject(isExcluded)
      .takeUntilBy(inclusive$)
      .merge(inclusive$);
  })
  .init(function initEvents () {
    const getExecutable = get('executable');

    const uniqueExecutable = curry((filter, obs) => {
      return obs.filter(filter)
        .map(dereference)
        .skipDuplicates();
    });

    const emitOnValue = (obs, event) => {
      return obs.onValue(value => {
        this.emit(event, value);
      });
    };

    const emitBaseEvents = (type, extraFilter = identity) => {
      const firstType = head(type.split(':'));
      const filter = overEvery(pipe(getExecutable, is[firstType]), extraFilter);
      const unique = uniqueExecutable(filter);
      emitOnValue(unique(this.executable$), `runner:${type}`);
      emitOnValue(unique(this.inclusive$), `runner:${type}:include`);
      emitOnValue(unique(this.excluded$), `runner:${type}:exclude`);
      return emitOnValue(unique(this.runnable$), `runner:${type}:runnable`);
    };

    this.runnableSuite$ =
      emitOnValue(emitBaseEvents('suite'), 'runner:suite:run');
    this.runnableTest$ = emitBaseEvents('test');
    emitBaseEvents('hook');

    const isOnce = pipe(get('opts.once'), Boolean);
    const isPre = pipe(get('opts.when'), eq('pre'));

    this.runnablePreHook$ =
      emitBaseEvents('hook:pre', overEvery(isOnce, isPre));
    this.runnablePostHook$ =
      emitBaseEvents('hook:post', overEvery(isOnce, negate(isPre)));
    this.runnablePreEachHook$ =
      emitBaseEvents('hook:pre-each', overEvery(negate(isOnce), isPre));
    this.runnablePostEachHook$ =
      emitBaseEvents('hook:post-each', negate(overEvery(isOnce, isPre)));

    const run$ = this.delegate.eventStream('mocha:run');

    emitOnValue(this.runnablePreHook$.bufferBy(this.runnableSuite$)
      .flatten()
      .bufferBy(run$)
      .flatten(), 'runner:hook:pre:run');

    emitOnValue(this.runnablePreEachHook$.bufferBy(this.runnableSuite$)
      .flatten()
      .sampledBy(this.runnableTest$)
      .bufferBy(run$)
      .flatten(), 'runner:hook:pre-each:run');

    emitOnValue(this.runnableTest$.bufferBy(run$)
      .flatten(), 'runner:test:run');

    emitOnValue(this.runnablePostHook$.bufferBy(this.runnableSuite$)
      .flatten()
      .bufferBy(run$)
      .flatten(), 'runner:hook:post:run');

    emitOnValue(this.runnablePreEachHook$.bufferBy(this.runnableSuite$)
      .flatten()
      .sampledBy(this.runnableTest$)
      .bufferBy(run$)
      .flatten(), 'runner:hook:pre-each:run');
  });

export default Runner;
