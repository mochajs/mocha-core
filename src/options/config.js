'use strict';

import {EventEmittable, Singleton, Mappable} from '../core/base';
import {forEach} from 'lodash';
import rc from './rc';
import stampit from 'stampit';

const Config = stampit({
  refs: {
    state: null
  },
  init() {
    if (this.state !== 'loaded') {
      // TODO: get defaults
      const defaults = {};
      this.reload(defaults);
    }
  },
  methods: {
    reload(defaults = {}) {
      this.update(rc(defaults, process.argv));
      this.state = 'loaded';
    },
    update(...objs) {
      // update right-to-left
      forEach(objs.reverse(), obj => {
        forEach(obj, (value, key) => {
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
