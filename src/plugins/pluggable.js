'use strict';

import stampit from 'stampit';
import {Graphable, EventEmittable, Mappable} from '../core';
import loader, {kLoader} from './loader';
import installer from './installer';
import _ from 'highland';
import {Kefir} from 'kefir';

const Pluggable = stampit({
  refs: {
    depGraph: Graphable()
  },
  init () {
    this.plugins = Mappable();

    const emitError = err => {
      this.emit('error', err);
    };

    kLoader(this);

    // this.useStream = _('use', this)
    //   .through(loader)
    //   .through(installer)
    //   .each(plugin => this.plugins.set(plugin.name, plugin))
    //   .on('error', emitError);
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
