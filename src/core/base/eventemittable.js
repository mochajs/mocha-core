'use strict';

const {EventEmitter} = require('events');
const stampit = require('stampit');
const Promise = require('bluebird');
const _ = require('lodash');

function wait(event) {
  return new Promise(resolve => {
    this.once(event, (...args) => {
      if (_.isEmpty(args)) {
        return resolve();
      } else if (args.length === 1) {
        return resolve(_.first(args));
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
      return _.isFinite(timeout)
        ? wait.call(this, event).timeout(timeout)
        : wait.call(this, event);
    }
  })
  .static({
    init(...args) {
      return this.enclose(...args);
    }
  });

module.exports = EventEmittable;