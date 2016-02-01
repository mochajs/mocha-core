'use strict';
/* eslint import/no-require:0 */

const _Map = typeof Map ===
'undefined'
  ? require('core-js/library/es6/map')
  : Map;
const _Set = typeof Set ===
'undefined'
  ? require('core-js/library/es6/set')
  : Set;
const _Symbol = typeof Symbol === 'undefined' ? require(
  'core-js/library/es6/symbol') : Symbol;
const _WeakMap = typeof WeakMap === 'undefined' ? require(
  'core-js/library/es6/weak-map') : WeakMap;

export {
  _Map as Map,
  _Set as Set,
  _WeakMap as WeakMap,
  _Symbol as Symbol
};
