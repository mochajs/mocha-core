'use strict';

const interfaces = new Map();
const Joi = require('joi');

const ui = {
  interfaces,
  add(name, func) {
    Joi.assert(name, Joi.string()
      .required()
      .description('Name of UI to add'));
    Joi.assert(func, Joi.func()
      .required()
      .description('Factory function of UI to add'));
    if (interfaces.has(name)) {
      throw new Error(`ui with name "${name}" already registered`);
    }
    interfaces.set(name, func);
  },
  get(name) {
    if (!interfaces.has(name)) {
      throw new Error(`Unknown interface "${name}"`);
    }
    return interfaces.get(name);
  },
  UI: require('./ui'),
  Hook: require('./hook'),
  Suite: require('./suite'),
  Test: require('./test'),
  Context: require('./context')
};

module.exports = ui;
