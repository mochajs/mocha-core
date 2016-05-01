import stampit from 'stampit';
import {Mappable, EventEmittable} from '../core';
import PluginLoader from './loader';
import is from 'check-more-types';

const Pluggable = stampit({
  static: {
    isPluginLike (pattern) {
      return is.not.empty(pattern) && is.or(is.string, is.function)(pattern);
    }
  },
  props: {
    ready: true
  },
  init ({stamp}) {
    this.factory = this.factory || stamp;
    this.loadedPlugins = Mappable();
  },
  methods: {
    load (opts = {}) {
      let loader = this.loader;

      if (!this.loader) {
        loader = this.loader = PluginLoader()
          .on('plugin-loading', () => {
            this.ready = false;
          })
          .on('plugin-loaded', plugin => {
            this.loadedPlugins.set(plugin.name, plugin);
          })
          .on('plugin-not-loaded', plugin => {
            // debug here?
          })
          .on('ready', () => {
            this.ready = true;
          })
          .on('error', err => this.emit('error', err));
      }

      loader.load(opts);
    },
    use (pattern, opts = {}) {
      if (is.defined(pattern) && this.factory.isPluginLike(pattern)) {
        this.load({
          pattern,
          opts,
          api: this
        });
      }
      return this;
    }
  }
})
  .compose(EventEmittable);

export default Pluggable;
