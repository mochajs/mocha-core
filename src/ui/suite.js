'use strict';

const stampit = require('stampit');
const Unique = require('./../core/base/unique');
const _ = require('lodash');
const debug = require('debug')('mocha3:ui:suite');

const Suite = stampit({
  refs: {
    parent: null,
    pending: false
  },
  methods: {
    addChild(suite) {
      this.children.push(suite);
      return this;
    },
    execute() {
      if (!this.pending) {
        this.func();
      }
    }
  },
  init({instance}) {
    debug('Creating suite with instance', instance);

    this.children = this.children || [];
    if (this.parent) {
      if (!_.isFunction(this.func) || this.parent.pending) {
        this.pending = true;
      }
      this.parent.addChild(this);
    }

    Object.defineProperty(this, 'fullTitle', {
      get() {
        let suite = this;
        const fullTitle = [];
        while (suite.title && suite.parent) {
          fullTitle.unshift(suite.title);
          suite = suite.parent;
        }
        return fullTitle.join(' ');
      }
    });
  }
})
  .compose(Unique);

module.exports = Suite;
