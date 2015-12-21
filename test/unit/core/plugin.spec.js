'use strict';

const Promise = require('bluebird');
const {DepGraph} = require('dependency-graph');
const _ = require('lodash');

describe(`core/plugin`, () => {
  const Plugin = require('../../../src/core/plugin');

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/plugin');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Plugin()`, () => {
    it(`should not throw if "dependencies" is a string value`, () => {
      const graph = new DepGraph();
      graph.addNode('bar');
      expect(() => Plugin({
        name: 'foo',
        func: _.noop,
        dependencies: 'bar',
        api: {},
        depGraph: graph
      }))
        .not
        .to
        .throw();
    });

    it(`should not throw if "dependencies" is an Array value`, () => {
      const graph = new DepGraph();
      graph.addNode('bar');
      graph.addNode('baz');
      expect(() => Plugin({
        name: 'foo',
        func: _.noop,
        dependencies: [
          'bar',
          'baz'
        ],
        api: {},
        depGraph: graph
      }))
        .not
        .to
        .throw();
    });

    it(`should not throw if no "dependencies" are passed`, () => {
      expect(() => Plugin({
        name: 'foo',
        func: _.noop,
        api: {},
        depGraph: new DepGraph()
      }))
        .not
        .to
        .throw();
    });

    it(`should throw if a circular dependency is detected`, () => {
      // this is unlikely to happen, but if it does, fail fast
      const graph = new DepGraph();
      Plugin({
        name: 'foo',
        func: _.noop,
        api: {},
        depGraph: graph,
        dependencies: 'bar'
      });
      expect(() => Plugin({
        name: 'bar',
        func: _.noop,
        api: {},
        depGraph: graph,
        dependencies: 'foo'
      }))
        .to
        .throw(Error, /cyclic/i);
    });

    describe(`member`, () => {
      let plugin;
      let func;
      let api;

      beforeEach(() => {
        func = sandbox.stub()
          .returns(Promise.resolve());
        api = {
          barf: _.noop
        };
        plugin = Plugin({
          name: 'foo',
          func: func,
          api: api,
          depGraph: new DepGraph(),
          version: '1.0.0'
        });
        plugin.func = func;
      });

      describe(`property`, () => {
        describe(`dependencies`, () => {
          it(`should call DepGraph#dependenciesOf()`, () => {
            sandbox.spy(plugin.depGraph, 'dependenciesOf');
            plugin.dependencies;
            expect(plugin.depGraph.dependenciesOf).to.have.been.calledOnce;
          });
        });

        describe(`originalDependencies`, () => {
          it(`should not be enumerable`, () => {
            _.forEach(plugin, (value, key) => {
              expect(key)
                .not
                .to
                .equal('originalDependencies');
            });
          });

          it(`should not be writable`, () => {
            expect(() => plugin.originalDependencies = 'foo')
              .to
              .throw(Error);
          });
        });

        describe(`depGraph`, () => {
          it(`should not be enumerable`, () => {
            _.forEach(plugin, (value, key) => {
              expect(key)
                .not
                .to
                .equal('depGraph');
            });
          });

          it(`should not be writable`, () => {
            expect(() => plugin.depGraph = 'foo')
              .to
              .throw(Error);
          });
        });
      });

      describe(`method`, () => {
        describe(`toJSON()`, () => {
          it(`should return an object with 'name', 'dependencies', and 'version' props`,
            () => {
              expect(plugin.toJSON())
                .to
                .have
                .keys('name', 'dependencies', 'version');
            });
        });
      });
    });
  });
});
