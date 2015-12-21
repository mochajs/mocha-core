'use strict';

const stampit = require('stampit');
const _ = require('lodash');

const Mappable = stampit({
  init() {
    return new Map();
  },
  static: {
    methods(obj) {
      return this.init(function mappableInit() {
        return _.mixin(this, obj, {
          chain: false
        });
      });
    }
  }
});

module.exports = Mappable;
