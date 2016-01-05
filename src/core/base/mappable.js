'use strict';

const stampit = require('stampit');
const _ = require('lodash');
const Map = require('es6-map');

const Mappable = stampit({
  init({stamp, instance}) {
    return _(new Map(_.pairs(instance)))
      .mixin(stamp.fixed.methods, {chain: false})
      .defaults(stamp.fixed.refs)
      .assign(stamp.fixed.props)
      .value();
  }
});

module.exports = Mappable;
