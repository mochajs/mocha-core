import stampit from 'stampit';
import {defaults} from 'lodash/fp';
import {forEach} from 'lodash';
import is from 'check-more-types';

const Decoratable = stampit({
  props: {
    delegate: {}
  },
  methods: {
    decorate (propName, propValue, opts = {}) {
      if (is.array(propName)) {
        forEach(propName,
          value => this.decorate(value.name, value.func, value.opts));
        return this;
      } else if (is.object(propName)) {
        forEach(propName, (value, key) => this.decorate(key, value));
        return this;
      }
      opts = defaults({
        args: [],
        context: this
      }, opts);
      // TODO: given an option, warn the user if a plugin blasts an existing plugin
      this.delegate[propName] = propValue.bind(opts.context, ...opts.args);
      return this;
    }
  }
});

export default Decoratable;
