'use strict';

import stampit from 'stampit';

const container = new WeakMap();

const Singleton = stampit({
  init({stamp}) {
    return container.get(stamp) || (container.set(stamp, this) && this);
  }
});

export default Singleton;
