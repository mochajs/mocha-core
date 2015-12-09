'use strict';

const stampit = require('stampit');
const isUndefined = require('lodash/lang/isUndefined');

const Reflectable = stampit({
  props: {
    stampName: 'Reflectable'
  },
  'static': {
    stampName(value) {
      if (isUndefined(value)) {
        return this.fixed.props.stampName;
      }
      return this.props({
        stampName: value
      });
    },
    toString() {
      return `[stamp ${this.stampName()}]`;
    }
  }
});

module.exports = Reflectable;
