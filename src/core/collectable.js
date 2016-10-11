import stampit from '../ext/stampit';
import is from 'check-more-types';
import {
  toPairs, mixin, assign, omitBy, omit, cloneDeep, defaults
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
    // TODO use lodash/fp
    const props = toPairs(omitBy(instance,
      (value, key) => is.function(value) || key === 'constructor'));

    const retval = new this.constructor(props);

    mixin(retval, stamp.fixed.methods, {chain: false});
    defaults(retval, omit(stamp.fixed.refs, 'constructor'));
    return assign(retval, cloneDeep(stamp.fixed.props));
  }
});

export default Collectable;
