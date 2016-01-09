'use strict';

function makeArray(value) {
  return [].concat(value || []);
}

export default makeArray;
