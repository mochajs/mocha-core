import stampit from 'stampit';
import {Decoratable, EventEmittable, Streamable} from '../core';
import {get, negate} from 'lodash/fp';
import {Kefir} from 'kefir';

const Runner = stampit({
  init () {
    const suites = this.suites;
    const isExcluded = get('opts.exclude');
    const isInclusive = get('opts.include');
    const included = suites.filter(isInclusive);

    suites.filter(isExcluded)
      .onValue(({suite}) => this.emit('suite:exclude', suite));

    suites.filter(negate(isExcluded))
      .filter(negate(isInclusive))
      .onValue(({suite}) => this.emit('suite:run', suite));

  }
})
  .compose(EventEmittable, Decoratable, Streamable);

export default Runner;
