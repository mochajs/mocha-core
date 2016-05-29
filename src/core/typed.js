import stampit from 'stampit';
import {Set, from} from '../util';
import is from 'check-more-types';
import {camelCase} from 'lodash';

const knownTypes = new Set();

function addType (__type__) {
  if (!knownTypes.has(__type__)) {
    knownTypes.add(__type__);
    is.mixin(function (value) {
      return is.object(value) && value.hasOwnProperty('__types__') &&
        value.__types__.has(__type__);
    }, camelCase(__type__));
  }
}

function typed (__type__ = 'Factory') {
  addType(__type__);

  return stampit({
    init () {
      if (is.set(this.__types__)) {
        this.__types__ = new Set(from(this.__types__).concat(__type__));
      } else {
        this.__types__ = new Set([__type__]);
      }
    }
  });
}

export default typed;
export {knownTypes};
