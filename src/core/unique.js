import stampit from '../ext/stampit';
import cuid from 'cuid';

const Unique = stampit({
  init () {
    const id = this.id || cuid();
    Object.defineProperty(this, 'id', {
      value: id,
      configurable: true,
      writable: false,
      enumerable: true
    });
  }
});

export default Unique;
