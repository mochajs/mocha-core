'use strict';

const EventEmitter = require('events').EventEmitter;
const stampit = require('stampit');
const omit = require('lodash/object/omit');

const EventEmittable = stampit.convertConstructor(EventEmitter)
  .static({
    static(staticProps) {
      return this.static(omit(staticProps, [
        'init',
        'props',
        'refs',
        'methods',
        'compose',
        'create'
      ]));
    },
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
  });

module.exports = EventEmittable;
