'use strict';

const stampit = require('stampit');
const packageName = require('../../package.json').name;

const Debuggable = stampit({
  'static': {
    namespace(ns = packageName) {

      return this.init(function debuggableInit() {
        privateState.set(this, {

        })
      })
        .methods({
        debug: require('debug')(ns)
      });
    }
  }
});

const privateState = require('./private-state')(Debuggable);

module.exports = Debuggable;
