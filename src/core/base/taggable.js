'use strict';

import stampit from 'stampit';
import Set from 'es6-set';
import forEach from 'lodash/collection/forEach';

function tag(...tags) {
  const tagSet = new Set();
  forEach(tags, tag => tagSet.add(tag));
  return this.init(function tagInit({instance}) {
    forEach(instance.tags, tag => tagSet.add(tag));
    this.tags = tagSet;
  });
}

const Taggable = stampit({
  static: {
    tag,
    tags: tag
  }
});

export default Taggable;
