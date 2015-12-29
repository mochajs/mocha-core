'use strict';

const stampit = require('stampit');
const Symbol = global.Symbol || require('core-js/library/fn/symbol');

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
