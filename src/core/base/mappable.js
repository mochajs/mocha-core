'use strict';

import {Map} from '../../polyfill';
import {fromPairs} from 'lodash';
import Collection from './collection';

const Mappable = Collection.constructor(Map)
  .methods({
    toJSON() {
      return fromPairs(Array.from(this));
    }
  });

export default Mappable;
