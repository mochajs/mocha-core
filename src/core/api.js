'use strict';

const toMap = require('../util/to-map');
const customError = require('../util/custom-error');
const extend = require('lodash/object/extend');
const ParamValidator = require('./param-validator');
const Unique = require('./unique');
const Plugin = require('./plugin');
const APIError = customError('APIError');
const Joi = require('joi');

const API = ParamValidator
  .stampName('API')
  .compose(Unique)
  .static({
    APIError
  })
  .validate({
    methods: {
      use(func, opts) {
        const plugins = this.plugins;
        const api = this;
        const {name, dependencies} = func.attributes;
        if (plugins.has(name)) {
          throw APIError(`Plugin name collision: ${name} already registered`);
        }
        const depGraph = this.depGraph;
        const plugin = Plugin(extend(opts || {}, {
          name,
          func,
          dependencies,
          api,
          depGraph: depGraph
        }));
        this.depGraph = plugin.depGraph;
        plugins.set(name, plugin);
        return this;
      }
    }
  }, {
    methods: {
      use: [
        Joi.func()
          .keys({
            attributes: Joi
              .object({
                name: Joi.string()
                  .label('name')
                  .description('Plugin name')
                  .required(),
                dependencies: Joi.array()
                  .single(true)
                  .label('dependencies')
                  .description('Plugin dependencies')
              })
              .label('attributes')
              .description('Plugin function "attributes" property')
              .required()
          })
          .unknown(true)
          .label('func')
          .description('Plugin function')
          .required(),
        Joi.object()
          .label('options')
          .description('Plugin function options')
      ]
    }
  })
  .init(function initAPI() {
    this.plugins = toMap(this.plugins);
    this.apis = toMap(this.apis);
  });

module.exports = API;

