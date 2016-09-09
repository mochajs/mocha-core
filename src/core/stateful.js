import Model from 'kefir-model';
import stampit from 'stampit';
import {defaults, forEach, keys} from 'lodash/fp';
import {WeakMap} from '../util';

const stateMap = new WeakMap();

const Stateful = stampit({
  static: {
    initialState (initialState = {}) {
      return this.refs(
        defaults({initialState}, this.fixed.refs.initialState || {}));
    }
  },
  init () {
    const initialState = this.initialState;
    const state = Model(initialState);
    forEach(path => {
      Object.defineProperties(this, {
        [path]: {
          get () {
            return stateMap.get(this).getIn(path);
          },
          set (newState) {
            return stateMap.get(this).setIn(path, newState);
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
    stateMap.set(this, state);
  },
  methods: {
    getState () {
      return stateMap.get(this).get();
    },
    setState (newState) {
      return stateMap.get(this).set(newState);
    },
    modify (func) {
      return stateMap.get(this).modify(func);
    },
    plug (observable) {
      return stateMap.get(this).plug(observable);
    },
    plugModify (observable) {
      return stateMap.get(this).plugModify(observable);
    },
    lens (path) {
      return stateMap.get(this).lens(path);
    }
  }
});

export default Stateful;
