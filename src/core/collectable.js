'use strict';

import stampit from 'stampit';
import {
  isFunction, omit, omitBy, clone, defaults, mixin, assign, toPairs
} from 'lodash';

const Collectable = stampit({
  static: {
    constructor (collection) {
      return this.refs({
        constructor: collection
      });
    }
  },
  init ({stamp, instance}) {
    const props = omitBy(instance,
      (value, key) => isFunction(value) || key === 'constructor');

    const retval = new this.constructor(Array.isArray(instance)
      ? props
      : toPairs(props));

    mixin(retval, stamp.fixed.methods, {chain: false});
    defaults(retval, omit(stamp.fixed.refs, 'constructor'));
    return assign(retval, clone(stamp.fixed.props));
  }
});

export default Collectable;
