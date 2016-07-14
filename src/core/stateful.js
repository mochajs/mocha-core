import Model from 'kefir-model';
import stampit from 'stampit';
import {defaults, forEach, keys} from 'lodash/fp';

const Stateful = stampit({
  static: {
    initialState (initialState = {}) {
      return this.props(
        defaults({initialState}, this.fixed.props.initialState));
    }
  },
  props: {
    initialState: {}
  },
  init () {
    const initialState = this.initialState;
    forEach(path => {
      Object.defineProperties(this, {
        [path]: {
          get () {
            return this.state.getIn(path);
          },
          set (newState) {
            return this.state.setIn(path, newState);
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
    this.state = Model(initialState);
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
