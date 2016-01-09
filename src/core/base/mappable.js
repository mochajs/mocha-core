'use strict';

import stampit from 'stampit';
import _ from 'lodash';
import Map from 'es6-map';

const Mappable = stampit({
  init({stamp, instance}) {
    const map = new Map(_.pairs(instance));
    _.mixin(map, stamp.fixed.methods, {chain: false});
    _.defaults(map, stamp.fixed.refs);

    return _.assign(map, stamp.fixed.props);
  }
});

export default Mappable;
