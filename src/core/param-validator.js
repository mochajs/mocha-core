'use strict';

const Joi = require('joi');
const stampit = require('stampit');
const negate = require('lodash/function/negate');
const partialRight = require('lodash/function/partialRight');
const mapValues = require('lodash/object/mapValues');
const isEmpty = require('lodash/lang/isEmpty');
const isFunction = require('lodash/lang/isFunction');
const map = require('lodash/collection/map');

const extend = stampit.extend;
const paramSchema = Joi.alternatives().try(Joi.object()
  .description('Joi schema'), Joi.array()
  .items(Joi.object()
    .description('Joi schema'))
  .description('Array of Joi schemas corresponding to method ' +
    'parameters'));

const isNotEmpty = negate(isEmpty);
const makeSchema = partialRight(mapValues, () => paramSchema);

function assertValidate(schemas, options) {
  Joi.assert(options, Joi.object({
    init: Joi.alternatives().try(Joi.array().items(Joi.func()), Joi.func())
      .description('Stampit init function(s)'),
    methods: Joi.object()
      .default({})
      .pattern(/.+/, Joi.func())
      .description('Stampit instance methods'),
    'static': Joi.object()
      .default({})
      .description('Stampit static methods/properties'),
    refs: Joi.object()
      .description('Stampit default property key/value pairs'),
    props: Joi.object()
      .description('Stampit property reference key/value pairs')
  })
    .unknown()
    .description('Stampit options object; see API docs at' +
      'https://github.com/stampit-org/stampit/blob/master/docs/API.md'));

  const schemaKeys = {};

  if (isFunction(options.init)) {
    schemaKeys.init = paramSchema;
  }
  if (isNotEmpty(options.methods)) {
    schemaKeys.methods = Joi.object(makeSchema(options.methods));
  }
  if (isNotEmpty(options.static)) {
    schemaKeys.static = Joi.object(makeSchema(options.static));
  }

  Joi.assert(schemas, Joi.object(schemaKeys)
    .unknown(false)
    .min(1)
    .required()
    .description('Joi schemas; each key maching an "options" entry.  ' +
      'Can be singular, or an array corresponding to each argument'));
}

function attempt(schemas, args) {
  schemas = [].concat(schemas);
  return map(schemas, (schema, position) => {
    return Joi.attempt(args[position], schema, `Invalid argument at position ` +
      `${position}`);
  });
}

function createProxy(value, schema) {
  if (isFunction(value)) {
    return function validationProxy() {
      return value.apply(this, attempt(schema, arguments));
    };
  }
  return value;
}

function createProxies(options, schemas) {
  return mapValues(options, (option, optionName) => {
    if (isFunction(option)) {
      return createProxy(option, schemas[optionName]);
    }
    return mapValues(schemas[optionName], (schema, keyName) => {
      return createProxy(options[optionName][keyName], schema);
    });
  });
}

const ParamValidator = stampit({
  'static': {
    validate(schemas, options) {
      options = options || this.fixed;
      assertValidate(schemas, options);
      extend(this.fixed, createProxies(options, schemas));
      return this;
    }
  }
});

module.exports = ParamValidator;
