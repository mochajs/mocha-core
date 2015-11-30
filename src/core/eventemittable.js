'use strict';

const EventEmitter = require('events').EventEmitter;
const stampit = require('stampit');
const Promise = require('bluebird');
const isNumber = require('lodash/lang/isNumber');

let privateState;

const EventEmittable = stampit.convertConstructor(EventEmitter)
  .static({
    on(event, action) {
      return this.init(function () {
        this.on(event, action);
      });
    },
    once(event, action) {
      return this.init(function () {
        this.once(event, action);
      });
    }
  })
  .methods({
    waitOn(event, timeout) {
      const wait = privateState.get(this).wait;
      return isNumber(timeout) ? wait(event).timeout(timeout) : wait(event);
    }
  });

privateState = require('./private-state')(EventEmittable, {
  wait(event) {
    return new Promise(resolve => {
      this.once(event, (...args) => {
        resolve(args);
      });
    });
  }
});

EventEmittable.init = EventEmittable.enclose;

module.exports = EventEmittable;
