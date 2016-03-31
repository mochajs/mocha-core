import stampit from 'stampit';
import {Mappable, Graphable, EventEmittable} from '../core';
import PluginLoader from './loader';
import is from 'check-more-types';

const Pluggable = stampit({
  refs: {
    depGraph: Graphable()
  },
  init () {
    this.loadedPlugins = Mappable();
    this.loader = PluginLoader({
      onDone: loadedPlugins => {
        loadedPlugins.forEach(
          plugin => this.loadedPlugins.set(plugin.name, plugin));
        this.emit('done');
      }
    })
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
    },
    ready () {
      this.loader.dump();
    }
  }
})
  .compose(EventEmittable);

export default Pluggable;
