'use strict';

import stampit from 'stampit';
import {Graphable, EventEmittable, Mappable} from '../core';
import loader from './loader';
import {isEmpty, isString, isFunction} from 'lodash/fp';

const Pluggable = stampit({
  refs: {
    depGraph: Graphable()
  },
  init () {
    this.plugins = Mappable();
    this.loadStream = loader(this)
      .takeErrors(1)
      .onError(err => {
        this.emit('error', err);
      });
  },
  methods: {
    use (pattern, opts = {}) {
      if (!isEmpty(pattern) && (isString(pattern) || isFunction(pattern))) {
        this.emit('use', {
          pattern,
          opts,
          depGraph: this.depGraph,
          api: this
        });
        return this;
      }
      this.emit('error', new Error('Function or path to plugin required'));
    }
  }
})
  .compose(EventEmittable);

export default Pluggable;
