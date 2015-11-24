'use strict';

var Buffer = {
  isBuffer: function() {
    return false;
  }
};

module.exports = {
  Buffer: Buffer
};
