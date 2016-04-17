import stampit from 'stampit';
import {defaults} from 'lodash/fp';
import {forEach} from 'lodash';
import is from 'check-more-types';

const Decoratable = stampit({
  props: {
    delegate: {}
  },
  methods: {
    decorate (name, func, opts = {}) {
      if (is.array(name)) {
        forEach(name,
          value => this.decorate(value.name, value.func, value.opts));
        return this;
      } else if (is.object(name)) {
        forEach(name, (value, key) => this.decorate(key, value));
        return this;
      }
      if (is.not.function(func)) {
        throw new Error('"func" must be a Function');
      }
      opts = defaults({
        args: [],
        context: this
      }, opts);
      // TODO: given an option, warn the user if a plugin blasts an existing plugin
      this.delegate[name] = func.bind(opts.context, ...opts.args);
      return this;
    }
  }
});

export default Decoratable;
