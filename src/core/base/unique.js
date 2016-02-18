'use strict';

import stampit from 'stampit';
import {v4} from 'uuid';

const Unique = stampit({
  init () {
    this.id = v4();
  }
});

export default Unique;
