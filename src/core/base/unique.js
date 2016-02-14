'use strict';

import stampit from 'stampit';

const Unique = stampit({
  init() {
    Object.defineProperty(this, 'id', {
      value: Symbol(),
      writable: false,
      configurable: true
    });
  }
});

export default Unique;
