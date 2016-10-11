import {curry} from 'lodash/fp';
import core from '../../vendor/core-js';

export const {Map, Set, from, setImmediate, Promise} = core;

export const remove = curry(function remove (prop, obj) {
  delete obj[prop];
  return obj;
});

export {Map, Set, from, setImmediate, Promise};

