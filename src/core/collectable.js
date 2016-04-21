import stampit from 'stampit';
import is from 'check-more-types';
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
    // TODO use lodash/fp
    const props = _.toPairs(_.omitBy(instance,
      (value, key) => is.function(value) || key === 'constructor'));

    const retval = new this.constructor(props);

    _.mixin(retval, stamp.fixed.methods, {chain: false});
    _.defaults(retval, _.omit(stamp.fixed.refs, 'constructor'));
    return _.assign(retval, _.cloneDeep(stamp.fixed.props));
  }
});

export default Collectable;
