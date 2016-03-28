import stampit from 'stampit';
import {Mappable, Graphable, EventEmittable} from '../core';
import PluginLoader from './loader';
import is from 'check-more-types';

const Pluggable = stampit({
  refs: {
    depGraph: Graphable()
  },
  init () {
    this.plugins = Mappable();
    this.loader = PluginLoader({
      onDone: (err, loadedPlugins) => {
        if (err) {
          return this.emit('error', err);
        }
        loadedPlugins.forEach(plugin => this.plugins.set(plugin.name, plugin));
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
