import {curry} from 'lodash/fp';

export const remove = curry(function remove (prop, obj) {
  delete obj[prop];
  return obj;
});

const Promise = global.Promise || require('core-js/library/fn/promise');
const Map = global.Map || require('core-js/library/fn/map');
const Set = global.Set || require('core-js/library/fn/set');
const WeakMap = global.WeakMap || require('core-js/library/fn/weak-map');
const from = Array.from || require('core-js/library/fn/array/from');
const setImmediate = global.setImmediate || require('core-js/library/fn/set-immediate');

export {Promise, Map, Set, WeakMap, from, setImmediate};
