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
    const pluginStream = this.pluginStream = _('use', this)
      .on('error', err => this.emit('error', err));

    this.loaderStream = loader(pluginStream);

    _([
      pluginStream,
      this.loaderStream
    ])
      .merge()
      .errors(err => {
        this.emit('error', err);
      });
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
