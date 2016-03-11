'use strict';

import StateMachine from 'fsm-as-promised';
import stampit from 'stampit';
import {pick, flatten} from 'lodash/fp';
import is from 'check-more-types';
import la from 'lazy-ass';

const getStateMachineProps = pick([
  'events',
  'callbacks',
  'initial',
  'final'
]);
const isEvent = is.schema({
  name: is.unemptyString,
  from: is.or(is.unemptyString, is.arrayOfUnemptyStrings),
  to: is.maybe.unemptyString
});

const FSM = stampit({
  refs: {
    callbacks: {}
  },
  props: {
    events: []
  },
  init () {
    StateMachine(getStateMachineProps(this), this);
  },
  static: {
    initial (state) {
      la(is.unemptyString(state));
      return this.props({initial: state});
    },
    final (state) {
      la(is.unemptyString(state));
      return this.props({final: state});
    },
    events (...args) {
      args = flatten(args);
      la(is.arrayOf(isEvent, args));
      return this.props({events: this.fixed.props.events.concat(args)});
    },
    event (obj) {
      la(isEvent(obj));
      return this.props({events: this.fixed.props.events.concat(obj)});
    },
    callback (name, func) {
      la(is.unemptyString(name));
      la(is.function(func));
      const callbacks = Object.assign({},
        this.fixed.refs.callbacks,
        {[name]: func});
      return this.refs({callbacks});
    },
    callbacks (obj) {
      la(is.object(obj));
      // TODO validate
      const callbacks = Object.assign({}, this.fixed.refs.callbacks, obj);
      return this.refs({callbacks});
    }
  }
});

export default FSM;
