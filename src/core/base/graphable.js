'use strict';

const stampit = require('stampit');
const {DepGraph} = require('dependency-graph');

const Graphable = stampit.convertConstructor(DepGraph);

module.exports = Graphable;
