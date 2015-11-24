'use strict';

const core = require('../core');
const Suite = require('./suite');
const Test = require('./test');
const stampit = require('stampit');
const get = require('lodash/object/get');
const isFunction = require('lodash/lang/isFunction');
const mapValues = require('lodash/object/mapValues');
const extend = stampit.extend;

const UI = stampit({
  refs: {
    filepath: null
  },
  props: {
    rootSuite: null
  },
  'static': {
    aliases(map) {
      extend(this.fixed.methods, mapValues(map, (alias, src) => {
        const srcFunc = get(this.fixed.methods, src);
        if (!isFunction(srcFunc)) {
          throw new Error(`Unknown function "${src}"`);
        }
      }));
      return this;
    }
  },
  methods: {
    suite(title, func) {
      const newSuite = Suite({
        filepath: this.filepath,
        title: title,
        func: func
      });
      this.emit('suite:enqueue', newSuite);
      return newSuite;
    },
    test(title, func) {
      const newTest = Test({
        filepath: this.tilepath,
        title: title,
        func: func
      });
      this.emit('test:enqueue', newTest);
      return newTest;
    }
  },
  init() {
    this.rootSuite = this.createSuite();
  }
})
  .compose(core.EventEmittable);

module.exports = UI;
