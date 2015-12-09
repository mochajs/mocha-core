'use strict';

const stampit = require('stampit');

const Unique = stampit({
  init() {
    Object.defineProperty(this, 'id', {
      value: Symbol(),
      writable: false,
      configurable: true
    });
  }
});

module.exports = Unique;
