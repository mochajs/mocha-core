'use strict';

const stampit = require('stampit');

const idProp = Symbol();

const Unique = stampit({
  init() {
    this[idProp] = Symbol();
    Object.defineProperty(this, 'id', {
      value: this[idProp],
      writable: false,
      configurable: true
    });
  }
});

module.exports = Unique;
