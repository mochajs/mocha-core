import {EventEmittable, Singleton, Mappable} from '../core';
import rc from './rc';
import stampit from 'stampit';

const Config = stampit({
  refs: {
    state: null
  },
  init () {
    // TODO use FSM instead
    if (this.state !== 'loaded') {
      // TODO: get defaults
      const defaults = {};
      this.reload(defaults);
    }
  },
  methods: {
    reload (defaults = {}) {
      this.update(rc(defaults, process.argv));
      this.state = 'loaded';
    },
    update (...objs) {
      // update right-to-left
      objs.reverse.forEach(obj => {
        obj.forEach((value, key) => {
          this.set(key, value);
          this.emit(`set:${key}`, value);
        });
      });

      return this;
    }
  }
})
  .compose(EventEmittable, Mappable, Singleton);

export default Config;
