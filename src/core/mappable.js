'use strict';

import {fromPairs} from 'lodash';
import Collectable from './collectable';

const Mappable = Collectable.constructor(Map)
  .methods({
    toJSON () {
      return fromPairs(Array.from(this));
    }
  });

export default Mappable;
