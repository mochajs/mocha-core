'use strict';

const stampit = require('stampit');
const Unique = require('./../core/base/unique');

const Suite = stampit({
  refs: {
    parent: null,
    pending: false,
    children: []
  },
  methods: {
    addChild(suite) {
      this.children.push(suite);
      return this;
    },
    execute() {
      this.func();
    }
  },
  init() {
    if (this.parent) {
      this.pending = this.parent.pending || this.pending;
      this.parent.addChild(this);
    }
  }
})
  .compose(Unique);

module.exports = Suite;
