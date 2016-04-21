import StateMachine from 'fsm-as-promised';
import stampit from 'stampit';
import {flatten, startsWith} from 'lodash/fp';
import {assign} from 'lodash';

const startsWithOn = startsWith('on');

const FSM = stampit({
  props: {
    events: []
  },
  static: {
    initial (state) {
      return this.props({initial: state});
    },
    final (...args) {
      args = flatten(args);
      return this.props({final: args});
    },
    events (...args) {
      args = flatten(args);
      return this.props({events: this.fixed.props.events.concat(args)});
    },
    event (obj) {
      return this.props({events: this.fixed.props.events.concat(obj)});
    },
    callback (name, func) {
      if (!startsWithOn(name)) {
        name = `on${name}`;
      }
      name = name.toLowerCase();
      const callbacks = assign({},
        this.fixed.refs.callbacks,
        {[name]: func});
      return this.refs({callbacks});
    },
    callbacks (obj) {
      // TODO validate
      const callbacks = assign({}, this.fixed.refs.callbacks, obj);
      return this.refs({callbacks});
    }
  }
}).compose(StateMachine);

export default FSM;
