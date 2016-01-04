'use strict';

const stampit = require('stampit');
const EventEmittable = require('./base/eventemittable');
const _ = require('lodash');
const Mappable = require('./base/mappable');

const FSM = stampit({
  refs: {
    states: Mappable()
  },
  init() {
    /* eslint lodash3/prefer-lodash-method:0 */
    if (!this.state) {
      throw new Error('No initial state declared');
    }
    const states = {};
    this.states.forEach((eventMap, fromState) => {
      states[fromState] = {};
      eventMap.forEach((toState, event) => {
        states[fromState][event] = toState;
      });
    });
  }
})
  .compose(EventEmittable)
  .static({
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
  })
  .methods({
    emit(event, ...data) {
      const nextState = this.states.get(this.state)
        .get(event);
      if (nextState) {
        this.state = nextState;
        return this.emit(nextState, ...data);
      }
      return EventEmittable.fixed.methods.emit.call(this, event, ...data);
    }
  });

module.exports = FSM;
