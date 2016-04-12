import stampit from 'stampit';
import {EventEmittable} from '../core';
import {merge} from 'lodash/fp';

const Plugin = stampit({
  init () {
    Object.defineProperty(this, 'installed', {
      get () {
        return this.state === 'installed';
      }
    });
  },
  methods: {
    install (opts = {}) {
      this.emit('installing');
      try {
        this.func(this.api, merge(this.opts), opts);
      } catch (err) {
        return this.emit('error', err);
      }
      this.emit('installed');
      return this;
    }
  }
})
  .compose(EventEmittable)
  .on('installed', function onInstalled () {
    this.state = 'installed';
  });

export default Plugin;
