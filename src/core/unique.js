'use strict';

const uuid = require('uuid');
const stampit = require('stampit');

const Unique = stampit({
  'static': {
    generate: uuid.v4
  },
  init() {
    this.id = this.id || Unique.generate();
  }
});

module.exports = Unique;
