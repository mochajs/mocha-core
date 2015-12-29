'use strict';

const stampit = require('stampit');
const _ = require('lodash');
const Set = global.Set || require('core-js/library/fn/set');

function tag(...tags) {
  const tagSet = new Set();
  _.forEach(tags, tag => tagSet.add(tag));
  return this.init(function tagInit({instance}) {
    _.forEach(instance.tags, tag => tagSet.add(tag));
    this.tags = tagSet;
  });
}

const Taggable = stampit({
  static: {
    tag,
    tags: tag
  }
});

module.exports = Taggable;
