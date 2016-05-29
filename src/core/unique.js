import stampit from 'stampit';
import {v4} from 'uuid';

const Unique = stampit({
  init () {
    const id = this.id || v4();
    Object.defineProperty(this, 'id', {
      value: id,
      configurable: true,
      writable: false,
      enumerable: true
    });
  }
});

export default Unique;
