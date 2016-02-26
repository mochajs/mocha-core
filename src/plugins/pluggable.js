'use strict';

import stampit from 'stampit';
import {Graphable, EventEmittable} from '../core';
import loader from './loader';
import _ from 'highland';

const Pluggable = stampit({
  refs: {
    depGraph: Graphable()
  },
  init () {
    const emitError = err => {
      this.emit('error', err);
    };

    this.once('use', () => {
      this.loadStream = loader(this.useStream)
        .on('error', emitError);
    });

    this.useStream = _('use', this)
      .on('error', emitError);
  },
  methods: {
    use (pattern, opts = {}) {
      this.emit('use', {
        pattern,
        opts,
        depGraph: this.depGraph,
        api: this
      });
      return this;
    }
  }
})
  .compose(EventEmittable);

export default Pluggable;
