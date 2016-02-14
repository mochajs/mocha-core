'use strict';

if (typeof Set === 'undefined') {
  require('core-js/es6/set');
  console.log('Polyfilled Set');
}

if (typeof Symbol === 'undefined') {
  require('core-js/es6/symbol');
  console.log('Polyfilled Symbol');
}

if (typeof WeakMap === 'undefined') {
  require('core-js/es6/weak-map');
  console.log('Polyfilled WeakMap');
}

if (typeof Map === 'undefined') {
  require('es6-map/implement');
  console.log('Polyfilled Map');
}

if (!Array.from) {
  Array.from = require('array-from');
  console.log('Polyfilled Array.from');
}

if (!Object.assign) {
  Object.assign = require('object-assign');
  console.log('Polyfilled Object.assign');
}
