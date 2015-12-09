'use strict';

const stampit = require('stampit');

const idProp = Symbol();

const Unique = stampit({
  'static': {
    idProp,
    id(value) {
      return value[idProp];
    }
  },
  init() {
    this[idProp] = Symbol();
  }
});

module.exports = Unique;
