'use strict';

import stampit from 'stampit';
import {EventEmittable} from './base';
import fsm from 'fsm';
import {includes, reduce, mapValues} from 'lodash';

const FSM = stampit({
  props: {
    states: {}
  },
  init() {
    if (!this.state) {
      throw new Error('No initial state declared');
    }

    const states = this.states;

    fsm.validate(states);
    this.reachableStates = fsm.reachable(states);
  },
  static: {
    createActions(actionMap) {
      const actions = mapValues(actionMap, (toEvent, action) => {
        return this.createAction(action);
      });
      return this.methods(actions);
    },
    createAction(action) {
      return function fsmAction(...data) {
        const currentState = this.state;
        const nextState = this.states[currentState][action];
        if (nextState &&
          includes(this.reachableStates[currentState][nextState], action)) {
          this.state = nextState;
          this.emit(nextState, ...data);
          return this;
        }
        throw new Error(`Invalid state transition: "${action}()" not available in state "${currentState}"`);
      };
    },
    initialState(state) {
      return this.props({state});
    },
    state(name, eventMap = {}) {
      const states = Object.create(this.fixed.props.states);
      states[name] = eventMap;
      return this.props({states})
        .createActions(eventMap);
    },
    states(stateMap = {}) {
      const states = Object.assign({}, this.fixed.props.states, stateMap);
      return reduce(stateMap, (stamp, actionMap) => {
        return stamp.createActions(actionMap);
      }, this.props({states}));
    }
  }
})
  .compose(EventEmittable);

export default FSM;
