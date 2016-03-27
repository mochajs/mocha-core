import stampit from 'stampit';
import {Graphable, EventEmittable} from '../core';
import PluginLoader from './loader';
import is from 'check-more-types';

const Pluggable = stampit({
  refs: {
    depGraph: Graphable()
  },
  init () {
    this.loader = PluginLoader()
      .on('error', err => this.emit('error', err));
  },
  methods: {
    use (pattern, opts = {}) {
      if (is.not.empty(pattern) && is.or(is.string, is.function)(pattern)) {
        this.loader.load({
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
  .compose(EventEmittable)
  .once('ready', function onceReady () {
    this.plugins = this.loader.dump();
  });

export default Pluggable;
