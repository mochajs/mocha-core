'use strict';

const Joi = require('joi');
const negate = require('lodash/function/negate');
const partialRight = require('lodash/function/partialRight');
const mapValues = require('lodash/object/mapValues');
const isEmpty = require('lodash/lang/isEmpty');
const isFunction = require('lodash/lang/isFunction');
const map = require('lodash/collection/map');
const Reflectable = require('./reflectable');
const debug = require('debug')('mocha:core:param-validator');
const partial = require('lodash/function/partial');
const dump = require('../util/dump');

const paramSchema = Joi.alternatives()
  .try(Joi.object()
    .description('Joi schema')
    .label('schema'),
    Joi.array()
      .items(Joi.object()
        .label('schema')
        .description('Joi schema'))
      .description('Array of Joi schemas corresponding to method ' +
        'parameters'))
  .label('schemas');

const isNotEmpty = negate(isEmpty);
const makeSchema = partialRight(mapValues, () => paramSchema);

function assertValidate(schemas, options) {
  Joi.assert(options, Joi.object({
    init: Joi.func()
      .label('init')
      .description('Stampit init function(s)'),
    methods: Joi.object()
      .pattern(/.+/, Joi.func())
      .label('methods')
      .description('Stampit instance methods'),
    'static': Joi.object()
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
    .label('options')
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
    .label('schemas')
    .description('Joi schemas; each key maching an "options" entry.  ' +
      'Can be singular, or an array corresponding to each argument'));
}

function attempt(schemas, args) {
  schemas = [].concat(schemas);
  return map(schemas,
    (schema, position) => {
      debug(`attempt(): Trying ${dump(args[position])} against ` +
        `${dump(Joi.describe(schema))}`);
      return Joi.attempt(args[position], schema);
    });
}

function createProxy(value, schema, debugId) {
  if (isFunction(value)) {
    debug(`createProxy(): Creating proxy on ${debugId} with schema ` +
      `${dump(Joi.describe(schema))}`);
    const attemptProxy = partial(attempt, schema);
    return function validationProxy(...args) {
      return value.apply(this, attemptProxy(args));
    };
  }
  return value;
}

function createProxies(options, schemas, stamp) {
  return mapValues(options, (option, optionName) => {
    if (isFunction(option)) {
      return createProxy(option,
        schemas[optionName],
        `${stamp.stampName()}.${optionName}`);
    }
    return mapValues(schemas[optionName], (schema, keyName) => {
      return createProxy(options[optionName][keyName],
        schema,
        `${stamp.stampName()}.${optionName}.${keyName}`);
    });
  });
}

const ParamValidator = Reflectable.stampName('ParamValidator')
  .static({
    validate(options, schemas) {
      debug(`ParamValidator.validate(): Validating schemas: ` +
        `${Joi.describe(schemas)}`);
      assertValidate(schemas, options);
      const proxies = createProxies(options, schemas, this);
      return this.props(proxies.props)
        .refs(proxies.refs)
        .methods(proxies.methods)
        .static(proxies.static)
        .init(proxies.init);
    },
    validator: Joi
  });

module.exports = ParamValidator;
