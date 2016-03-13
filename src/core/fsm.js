'use strict';

import StateMachine from 'fsm-as-promised';
import stampit from 'stampit';
import {pick, flatten, startsWith} from 'lodash/fp';
import is from 'check-more-types';
import assert from 'lazy-ass';

const getStateMachineProps = pick([
  'events',
  'callbacks',
  'initial',
  'final'
]);

const startsWithOn = startsWith('on');

const isBasicEvent = is.schema({
  name: is.unemptyString,
  from: is.or(is.unemptyString, is.arrayOfUnemptyStrings),
  to: is.maybe.unemptyString
});

const isConditionalEvent = is.schema({
  name: is.unemptyString,
  from: is.or(is.unemptyString, is.arrayOfUnemptyStrings),
  to: is.arrayOfUnemptyStrings,
  condition: is.function
});

const isEvent = is.or(isBasicEvent, isConditionalEvent);

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
      assert(is.unemptyString(state));
      return this.props({initial: state});
    },
    final (...args) {
      args = flatten(args);
      assert(is.arrayOfUnemptyStrings(args));
      return this.props({final: args});
    },
    events (...args) {
      args = flatten(args);
      assert(is.arrayOf(isEvent, args));
      return this.props({events: this.fixed.props.events.concat(args)});
    },
    event (obj) {
      assert(isEvent(obj));
      return this.props({events: this.fixed.props.events.concat(obj)});
    },
    callback (name, func) {
      assert(is.unemptyString(name));
      assert(is.function(func));
      if (!startsWithOn(name)) {
        name = `on${name}`;
      }
      name = name.toLowerCase();
      const callbacks = Object.assign({},
        this.fixed.refs.callbacks,
        {[name]: func});
      return this.refs({callbacks});
    },
    callbacks (obj) {
      assert(is.object(obj));
      // TODO validate
      const callbacks = Object.assign({}, this.fixed.refs.callbacks, obj);
      return this.refs({callbacks});
    }
  }
});

export default FSM;
