'use strict';

const stampit = require('stampit');
const Unique = require('./../core/base/unique');
const Promise = require('bluebird');

const Suite = stampit({
  refs: {
    parent: null,
    children: []
  },
  methods: {
    run() {
      return Promise.try(this.func, [this], this)
        .return(this);
    }
  }
})
  .compose(Unique);

module.exports = Suite;
