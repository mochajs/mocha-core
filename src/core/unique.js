'use strict';

const stampit = require('stampit');

const idProp = Symbol();

const Unique = stampit({
  init() {
    this[idProp] = Symbol();
  },
  methods: {
    id() {
      return this[idProp];
    }
  }
});

module.exports = Unique;
