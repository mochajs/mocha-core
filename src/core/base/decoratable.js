'use strict';

import stampit from 'stampit';
import _ from 'lodash';

const Decoratable = stampit({
  refs: {
    delegate: {}
  },
  methods: {
    decorate(name, func, opts = {}) {
      if (_.isArray(name)) {
        _.forEach(name,
          value => this.decorate(value.name, value.func, value.opts));
        return this;
      } else if (_.isObject(name)) {
        _.forEach(name, (value, key) => this.decorate(key, value));
        return this;
      }
      _.defaults(opts, {
        args: [],
        context: this
      });
      this.delegate[name] = func.bind(opts.context, ...opts.args);
      return this;
    }
  }
});

export default Decoratable;
