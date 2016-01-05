'use strict';

const stampit = require('stampit');
const EventEmittable = require('./base/eventemittable');
const _ = require('lodash');
const Mappable = require('./base/mappable');
const fsm = require('fsm');

const FSM = stampit({
  refs: {
    states: Mappable()
  },
  init({stamp}) {
    /* eslint lodash3/prefer-lodash-method:0 */
    if (!this.state) {
      throw new Error('No initial state declared');
    }

    const states = this.states;
    // need to coerce the nested Maps into something fsm understands
    const fsmStates = {};
    states.forEach((actionMap, fromState) => {
      fsmStates[fromState] = {};
      if (actionMap) {
        actionMap.forEach((toState, action) => {
          fsmStates[fromState][action] = toState;
          // while we're in here, create the action function.
          this[action] =
            stamp.createAction(action)
              .bind(this);
        });
      }
    });

    fsm.validate(fsmStates);
    this.reachableStates = fsm.reachable(fsmStates);
  },
  static: {
    createAction(action) {
      return function(...data) {
        const currentState = this.state;
        const nextState = this.states.get(currentState)
          .get(action);
        if (_.includes(this.reachableStates[currentState][nextState], action)) {
          this.state = nextState;
          this.emit(nextState, ...data);
          return this;
        }
        throw new Error(`Invalid state transition: "${currentState}" => "${nextState}"`);
      };
    },
    initialState(state) {
      return this.refs({state});
    },
    state(name, eventMap = {}) {
      const states = Mappable(this.fixed.refs.states);
      states.set(name, Mappable(eventMap));
      return this.refs({states});
    },
    states(stateMap = {}) {
      const states = Mappable(this.fixed.refs.states);
      _.forEach(stateMap, (eventMap, state) => {
        states.set(state, Mappable(eventMap));
      });
      return this.refs({states});
    }
  }
})
  .compose(EventEmittable);

module.exports = FSM;
