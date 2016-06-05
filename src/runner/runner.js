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
  },
  methods: {
    run (executable) {
      return executable.execute()
        .catch(err => {
          console.log('oops');

          this.emit('error', err);
        })
        .then(result => {
          console.log('ok');

          this.emit('runner:result', result);
          return executable;
        });
    }
  }
})
  .compose(EventEmittable, Decoratable, Streamable)
  .methods({
    emit (event, ...data) {
      return EventEmittable.fixed.methods.emit.call(this, event, ...data);
    }
  })
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
    const run$ = this.delegate.eventStream('mocha:run');

    const uniqueExecutable = curry((filter, obs) => obs.filter(filter)
      .map(dereference)
      .skipDuplicates());

    const emitOnValue = curry((event, obs) => obs.onValue(value => {
      this.emit(`runner:${event}`, value);
    }));

    const emitBaseEvents = (type, extraFilter = identity) => {
      const typeCheck = get(head(type.split(':')), is);
      const filter = overEvery([pipe(getExecutable, typeCheck), extraFilter]);
      const unique = uniqueExecutable(filter);
      emitOnValue('executable', unique(this.executable$))
        .onValue(value => {
          this.emit(`runner:${type}`, value);
        });
      emitOnValue(`${type}:include`, unique(this.inclusive$));
      emitOnValue(`${type}:exclude`, unique(this.excluded$));
      return emitOnValue('runnable', unique(this.runnable$))
        .onValue(value => {
          this.emit(`runner:${type}:runnable`, value);
        });
    };

    const isOnce = pipe(get('opts.once'), Boolean);
    const isPre = pipe(get('opts.when'), eq('pre'));

    emitBaseEvents('suite');
    emitBaseEvents('hook:pre', overEvery([isOnce, isPre]));
    emitBaseEvents('hook:pre-each', overEvery([negate(isOnce), isPre]));
    emitBaseEvents('test');
    emitBaseEvents('hook:post-each', overEvery([negate(isOnce), negate(isPre)]));
    emitBaseEvents('hook:post', overEvery([isOnce, negate(isPre)]));
  });

export default Runner;
