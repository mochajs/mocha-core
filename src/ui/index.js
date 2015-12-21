'use strict';

const API = require('./../core/api');
const Suite = require('./suite');

const UI = API
  .methods({
    createSuite(suiteDef) {
      const suite = Suite(suiteDef);
      this.emit('suite', suite);
      return suite;
    },
    createTest() {

    },
    afterTests() {

    },
    beforeTests() {

    },
    afterEachTest() {

    },
    beforeEachTest() {

    },
    ignoreSuite() {

    },
    ignoreTest() {

    },
    onlySuite() {

    },
    onlyTest() {

    },
    expose(...args) {
      return this.mocha.expose(...args);
    }
  });

module.exports = UI;
