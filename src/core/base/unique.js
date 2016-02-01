'use strict';

import stampit from 'stampit';
import {Symbol} from '../../polyfill';

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
