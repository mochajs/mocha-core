'use strict';

const stampit = require('stampit');
const Symbol = require('es6-symbol');

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
