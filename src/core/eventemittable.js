'use strict';

const EventEmitter = require('events').EventEmitter;
const stampit = require('stampit');
const Promise = require('bluebird');
const first = require('lodash/array/first');
const isEmpty = require('lodash/lang/isEmpty');
const isFinite = require('lodash/lang/isFinite');

function wait(event) {
  return new Promise(resolve => {
    this.once(event, (...args) => {
      if (isEmpty(args)) {
        return resolve();
      } else if (args.length === 1) {
        return resolve(first(args));
      }
      return resolve(args);
    });
  });
}

const EventEmittable = stampit.convertConstructor(EventEmitter)
  .static({
    on(event, action) {
      return this.init(function initOn() {
        this.on(event, action);
      });
    },
    once(event, action) {
      return this.init(function initOnce() {
        this.once(event, action);
      });
    }
  })
  .methods({
    waitOn(event, timeout) {
      return isFinite(timeout)
        ? wait.call(this, event).timeout(timeout)
        : wait.call(this, event);
    }
  });

EventEmittable.init = EventEmittable.enclose;

module.exports = EventEmittable;
