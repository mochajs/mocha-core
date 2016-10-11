import stampit from '../ext/stampit';
import {Set} from '../util';

function tag (...tags) {
  return this.init(function tagInit () {
    tags.forEach(tag => this.tags.add(tag));
  });
}

const Taggable = stampit({
  static: {
    tag,
    tags: tag
  },
  init ({instance}) {
    this.tags = new Set(instance.tags);
  }
});

export default Taggable;
