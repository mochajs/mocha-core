'use strict';

import stampit from 'stampit';
import {isArray, forEach, defaults, isObject} from 'lodash';

const Decoratable = stampit({
  refs: {
    delegate: {}
  },
  methods: {
    decorate (name, func, opts = {}) {
      if (isArray(name)) {
        forEach(name,
          value => this.decorate(value.name, value.func, value.opts));
        return this;
      } else if (isObject(name)) {
        forEach(name, (value, key) => this.decorate(key, value));
        return this;
      }
      defaults(opts, {
        args: [],
        context: this
      });
      this.delegate[name] = func.bind(opts.context, ...opts.args);
      return this;
    }
  }
});

export default Decoratable;
