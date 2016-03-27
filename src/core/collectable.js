import stampit from 'stampit';
import is from 'check-more-types';
// TODO use lodash/fp
import _ from 'lodash';

const Collectable = stampit({
  static: {
    constructor (collection) {
      return this.refs({
        constructor: collection
      });
    }
  },
  init ({stamp, instance}) {
    const props = _.omitBy(instance,
      (value, key) => is.function(value) || key === 'constructor');

    const retval = new this.constructor(is.array(instance) ? props : _.toPairs(
      props));

    _.mixin(retval, stamp.fixed.methods, {chain: false});
    _.defaults(retval, _.omit(stamp.fixed.refs, 'constructor'));
    return Object.assign(retval, _.cloneDeep(stamp.fixed.props));
  }
});

export default Collectable;
