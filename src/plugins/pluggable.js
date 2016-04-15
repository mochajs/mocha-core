import stampit from 'stampit';
import {Mappable, EventEmittable} from '../core';
import PluginLoader from './loader';
import is from 'check-more-types';

const Pluggable = stampit({
  init () {
    this.loadedPlugins = Mappable();
  },
  methods: {
    use (pattern, opts = {}) {
      if (!this.loader) {
        this.loader = PluginLoader({
          onDone: loadedPlugins => {
            loadedPlugins.forEach(
              plugin => this.loadedPlugins.set(plugin.name, plugin));
            this.emit('done');
          }
        })
          .on('error', err => this.emit('error', err));
      }
      if (is.not.empty(pattern) && is.or(is.string, is.function)(pattern)) {
        this.loader.load({
          pattern,
          opts,
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
  .compose(EventEmittable)
  .on('done', function onDone () {
    delete this.loader;
  });

export default Pluggable;
