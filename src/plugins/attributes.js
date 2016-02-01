'use strict';

import stampit from 'stampit';
import _ from 'highland';

const Attributes = stampit({
  props: {
    dependencies: [],
    pkg: {}
  },
  init() {
    this.dependencies = _([].concat(this.dependencies));
    return _.extend(this, this.pkg, _.remove('pkg', this));
  }
});

export default Attributes;
