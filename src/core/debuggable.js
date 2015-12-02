'use strict';

const stampit = require('stampit');
const packageName = require('../../package.json').name;

const Debuggable = stampit({
  'static': {
    namespace(ns = packageName) {
      return this.methods({
        debug: require('debug')(ns)
      });
    }
  }
});

module.exports = Debuggable;
