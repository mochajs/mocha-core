'use strict';

const EventEmittable = require('./eventemittable');
const Unique = require('./unique');
const Promise = require('bluebird');
const ParamValidator = require('./param-validator');
const errorist = require('errorist');
const Joi = require('joi');
const {DepGraph} = require('dependency-graph');
const each = require('lodash/collection/each');
const customError = require('../util/custom-error');

const PluginError = customError('PluginError');

const Plugin = ParamValidator
  .stampName('Plugin')
  .compose(Unique)
  .static({
    PluginError
  })
  .validate({
    init() {
      const originalFunc = this.func;
      const func = this.func = Promise.method(this.func);
      const depGraph = this.depGraph = this.depGraph || new DepGraph();
      const name = this.name;
      const dependencies = this.dependencies;
      depGraph.addNode(name);
      each([].concat(dependencies || []), dep => {
        try {
          depGraph.addDependency(name, dep);
        } catch (ignored) {
          throw PluginError(`Cannot find dependency "${dep}" needed by ` +
            `plugin "${name}"`);
        }
      });
      try {
        depGraph.dependenciesOf(name);
      } catch (err) {
        throw PluginError(err.message, {
          plugin: {name, func, dependencies, depGraph}
        });
      }
      Object.defineProperty(this, 'originalFunc', {
        value: originalFunc,
        writable: false,
        configurable: true
      });
    }
  }, {
    init: [
      Joi.object({
        instance: Joi.object({
          name: Joi.string()
            .required()
            .label('name')
            .description('Plugin name'),
          func: Joi.func()
            .required()
            .label('func')
            .description('Plugin function'),
          dependencies: Joi.array()
            .items(Joi.string())
            .single(true)
            .label('dependencies')
            .description('Plugin dependencies'),
          api: Joi.object()
            .required()
            .label('api')
            .description('API object which each plugin will have access to')
        })
          .label('instance')
          .unknown(true)
          .description('Stampit instance')
      })
        .unknown(true)
    ]
  })
  .methods({
    load() {
      return this.func(this.api)
        .catch(err => {
          throw errorist(err);
        })
        .tap(() => this.emit('loaded', {
          name: this.name
        }));
    }
  })
  .compose(EventEmittable, Unique);

module.exports = Plugin;
