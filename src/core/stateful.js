import Model from 'kefir-model';
import stampit from 'stampit';
import {defaults, forEach, keys} from 'lodash/fp';

const Stateful = stampit({
  static: {
    initialState (initialState = {}) {
      return this.refs(
        defaults({initialState}, this.fixed.refs.initialState || {}));
    }
  },
  init () {
    const initialState = this.initialState;
    const state = this.state = Model(initialState);
    forEach(path => {
      Object.defineProperties(this, {
        [path]: {
          get () {
            return state.get(this).getIn(path);
          },
          set (newState) {
            return state.get(this).setIn(path, newState);
          },
          configurable: true
        },
        [`${path}$`]: {
          get () {
            return this.lens(path);
          },
          configurable: true
        }
      });
    }, keys(initialState));
  },
  methods: {
    getState () {
      return this.state.get();
    },
    setState (newState) {
      return this.state.set(newState);
    },
    modify (func) {
      return this.state.modify(func);
    },
    plug (observable) {
      return this.state.plug(observable);
    },
    plugModify (observable) {
      return this.state.plugModify(observable);
    },
    lens (path) {
      return this.state.lens(path);
    }
  }
});

export default Stateful;
