'use strict';

const Joi = require('joi');
const negate = require('lodash/function/negate');
const partialRight = require('lodash/function/partialRight');
const mapValues = require('lodash/object/mapValues');
const isEmpty = require('lodash/lang/isEmpty');
const isFunction = require('lodash/lang/isFunction');
const map = require('lodash/collection/map');
const Reflectable = require('./reflectable');
const partial = require('lodash/function/partial');
const get = require('lodash/object/get');
const contains = require('lodash/collection/contains');
const extend = require('lodash/object/extend');

const paramSchema = Joi.alternatives()
  .try(Joi.object()
    .description('Joi schema')
    .label('schema'), Joi.array()
    .items(Joi.object()
      .label('schema')
      .description('Joi schema'))
    .description('Array of Joi schemas corresponding to method ' +
      'parameters'))
  .label('schemas');

const optionsSchema = Joi
  .object({
    init: Joi.func()
      .label('init')
      .description('Stampit init function(s)'),
    methods: Joi.object()
      .pattern(/.+/, Joi.func())
      .label('methods')
      .description('Stampit instance methods'),
    static: Joi.object()
      .label('static')
      .description('Stampit static methods/properties'),
    refs: Joi.object()
      .label('refs')
      .description('Stampit default property key/value pairs'),
    props: Joi.object()
      .label('props')
      .description('Stampit property reference key/value pairs')
  })
  .unknown()
  .min(1)
  .label('options')
  .description('Stampit options object; see API docs at' +
    'https://github.com/stampit-org/stampit/blob/master/docs/API.md');

const isNotEmpty = negate(isEmpty);
const makeSchema = partialRight(mapValues, () => paramSchema);

function assertValidate(schemas, options) {
  Joi.assert(options, optionsSchema);

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
    .required()
    .label('schemas')
    .description('Joi schemas; each key maching an "options" entry.  ' +
      'Can be singular, or an array corresponding to each argument'));
}

function attempt(schemas, args) {
  schemas = [].concat(schemas);
  return map(schemas,
    (schema, position) => Joi.attempt(args[position], schema));
}

function createProxy(value, schema, optionName) {
  if (contains(createProxy.funcOptions, optionName) && isFunction(value)) {
    const attemptProxy = partial(attempt, schema);
    // extend here to copy over any props the function may have
    return extend(function validationProxy(...args) {
      return value.apply(this, attemptProxy(args));
    }, value);
  }
  return value;
}
createProxy.funcOptions = [
  'init',
  'methods',
  'static',
  'refs'
];

function createProxies(options, schemas) {
  return mapValues(options, (option, optionName) => {
    if (isFunction(option) && schemas[optionName]) {
      return createProxy(option, schemas[optionName], optionName);
    }
    return mapValues(option, (value, keyName) => {
      const schema = get(schemas, `${optionName}.${keyName}`);
      if (schema) {
        return createProxy(value, schema, optionName);
      }
      return value;
    });
  });
}

const ParamValidator = Reflectable.stampName('ParamValidator')
  .static({
    validate(options = {}, schemas = {}) {
      assertValidate(schemas, options);
      const {props, refs, methods, static_, init} = createProxies(options,
        schemas);
      return this.props(props)
        .refs(refs)
        .methods(methods)
        .static(static_)
        .init(init);
    }
  });

module.exports = ParamValidator;
