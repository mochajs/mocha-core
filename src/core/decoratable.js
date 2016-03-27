import stampit from 'stampit';
import {forEach, defaults} from 'lodash/fp';
import is from 'check-more-types';

const Decoratable = stampit({
  props: {
    delegate: {}
  },
  methods: {
    decorate (name, func, opts = {}) {
      if (is.array(name)) {
        forEach(value => this.decorate(value.name, value.func, value.opts),
          name);
        return this;
      } else if (is.object(name)) {
        forEach((value, key) => this.decorate(key, value), name);
        return this;
      }
      if (is.not.function(func)) {
        throw new Error('"func" must be a Function');
      }
      opts = defaults({
        args: [],
        context: this
      }, opts);
      this.delegate[name] = func.bind(opts.context, ...opts.args);
      return this;
    }
  }
});

export default Decoratable;
