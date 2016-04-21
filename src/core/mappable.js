import {fromPairs} from 'lodash/fp';
import Collectable from './collectable';
import {Map, from} from '../util';

const Mappable = Collectable.constructor(Map)
  .methods({
    toJSON () {
      return fromPairs(from(this));
    }
  });

export default Mappable;
