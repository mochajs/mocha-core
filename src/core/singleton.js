import stampit from 'stampit';
import {WeakMap} from '../util';

const Singleton = stampit({
  static: {
    container: new WeakMap(),
    reset () {
      this.container = new WeakMap();
      return this;
    }
  },
  init ({stamp}) {
    const container = stamp.container;
    return container.get(stamp) || (container.set(stamp, this) && this);
  }
});

export default Singleton;
