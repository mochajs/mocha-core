import stampit from 'stampit';
import {noop, forEach, partial, set, get, defaults} from 'lodash';
import is from 'check-more-types';

const Decoratable = stampit({
  props: {
    delegate: {}
  },
  methods: {
    decorate (keypath, value, opts = {}) {
      if (is.array(keypath)) {
        forEach(keypath,
          value => this.decorate(value.name, value.func, value.opts));
        return this;
      } else if (is.object(keypath)) {
        forEach(keypath, (value, key) => this.decorate(key, value));
        return this;
      }
      defaults(opts, {
        args: [],
        context: this
      });
      // TODO: given an option, warn the user if a plugin blasts an existing
      // plugin
      this.setDelegateProp(keypath,
        is.function(value) ? value.bind(opts.context, ...opts.args) : value);
      return this;
    },
    alias (fromKeypath, toKeypath) {
      this.setDelegateProp(toKeypath, this.delegateResult(fromKeypath));
      return this;
    },
    /**
     * Returns a function which will execute the method at `keypath` in the
     * delegate (if it's a method), otherwise it will simply return the value.
     * This allows plugin authors to create aliases to methods which are not
     * necessarily present at time of aliasing.
     * @param {string} keypath Keypath in delegate
     * @returns {Function}
     * @private
     */
    delegateResult (keypath) {
      if (is.unemptyString(keypath)) {
        return function result (...args) {
          const value = this.getDelegateProp(keypath);
          if (is.function(value)) {
            return value(...args);
          }
          return value;
        }.bind(this);
      }
      return noop;
    },
    /**
     * Emits an event on the delegate
     * @param {string} event
     * @param {...*} [args]
     */
    broadcast (event, ...args) {
      return this.delegate.emit(event, ...args);
    },
    onBroadcast (event, handler) {
      this.delegate.on(event, handler);
      return this;
    },
    onceBroadcast (event, handler) {
      this.delegate.once(event, handler);
      return this;
    },
    relay (...events) {
      events.forEach(event => {
        this.delegate.on(event, (...args) => {
          this.emit(event, ...args);
        });
      });
      return this;
    },
    relayOnce (...events) {
      events.forEach(event => {
        this.delegate.once(event, (...args) => {
          this.emit(event, ...args);
        });
      });
      return this;
    }
  },
  init () {
    this.setDelegateProp = partial(set, this.delegate);
    this.getDelegateProp = partial(get, this.delegate);
  }
});

export default Decoratable;
