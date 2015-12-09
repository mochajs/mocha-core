'use strict';

const EventEmittable = require('./eventemittable');
const Unique = require('./unique');
const Promise = require('bluebird');
const ParamValidator = require('./param-validator');
const errorist = require('errorist');
const validator = ParamValidator.validator;
const DepGraph = require('dependency-graph').DepGraph;
const each = require('lodash/collection/each');

const originalFuncProp = Symbol();

const Plugin = ParamValidator
  .stampName('Plugin')
  .compose(Unique)
  .refs({
    name: null,
    dependencies: [],
    func: null
  })
  .static({originalFuncProp})
  .validate({
    init() {
      this.originalFunc = this.func;
      this.func = Promise.method(this.func);
      const depGraph = this.depGraph = this.depGraph || new DepGraph();
      const name = this.name;
      depGraph.addNode(name);
      each(this.dependencies,
        dep => depGraph.addDependency(name, dep));
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
        .label('context')
        .description('Stampit init context')
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
