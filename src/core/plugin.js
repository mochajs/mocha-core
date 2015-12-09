'use strict';

const EventEmittable = require('./eventemittable');
const Unique = require('./unique');
const Promise = require('bluebird');
const ParamValidator = require('./param-validator');
const errorist = require('errorist');
const validator = ParamValidator.validator;
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
      this.func = Promise.method(this.func);
      const depGraph = this.depGraph = this.depGraph || new DepGraph();
      const name = this.name;
      depGraph.addNode(name);
      each([].concat(this.dependencies || []), dep => {
        try {
          depGraph.addDependency(name, dep);
        } catch (ignored) {
          throw PluginError(`Cannot find dependency "${dep}" needed by ` +
            `plugin "${name}"`);
        }
      });
      Object.defineProperty(this, 'originalFunc', {
        value: originalFunc,
        writable: false,
        configurable: true
      });
    }
  }, {
    init: [
      validator.object({
        instance: validator.object({
          name: validator.string()
            .required()
            .label('name')
            .description('Plugin name'),
          func: validator.func()
            .required()
            .label('func')
            .description('Plugin function'),
          dependencies: validator.array()
            .items(validator.string())
            .single(true)
            .label('dependencies')
            .description('Plugin dependencies'),
          api: validator.object()
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
