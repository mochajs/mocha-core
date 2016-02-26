'use strict';

import {EventEmittable, Graphable} from '../../../src/core';
import Plugin from '../../../src/plugins';
import _ from 'highland';
import noop from 'lodash/noop';

describe(`core/plugin`, () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/plugin');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Plugin()`, () => {
    it(`should not throw if "dependencies" is a string value`, () => {
      const graph = Graphable();
      graph.addNode('bar');
      expect(() => Plugin({
        name: 'foo',
        func: noop,
        dependencies: _(['bar']),
        api: EventEmittable(),
        depGraph: graph
      }))
        .not
        .to
        .throw();
    });

    it(`should not throw if "dependencies" is an Array value`, () => {
      const graph = Graphable();
      graph.addNode('bar');
      graph.addNode('baz');
      expect(() => Plugin({
        name: 'foo',
        func: noop,
        dependencies: _([
          'bar',
          'baz'
        ]),
        api: EventEmittable(),
        depGraph: graph
      }))
        .not
        .to
        .throw();
    });

    it(`should not throw if no "dependencies" are passed`, () => {
      expect(() => Plugin({
        name: 'foo',
        func: noop,
        api: EventEmittable(),
        depGraph: Graphable(),
        dependencies: _()
      }))
        .not
        .to
        .throw();
    });

    it(`should throw if a circular dependency is detected`, () => {
      // this is unlikely to happen, but if it does, fail fast
      const graph = Graphable();
      Plugin({
        name: 'foo',
        func: noop,
        api: EventEmittable(),
        depGraph: graph,
        dependencies: _(['bar'])
      });
      expect(() => Plugin({
        name: 'bar',
        func: noop,
        api: EventEmittable(),
        depGraph: graph,
        dependencies: _(['foo'])
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
        api = EventEmittable();
        plugin = Plugin({
          name: 'foo',
          func: func,
          api: api,
          depGraph: Graphable(),
          version: '1.0.0',
          dependencies: _()
        });
        plugin.func = func;
      });

      describe(`method`, () => {
        describe(`install()`, () => {
          it(`should return the Plugin instance`, () => {
            expect(plugin.install())
              .to
              .equal(plugin);
          });

          describe(`if not installed`, () => {
            it(`should install`, () => {
              plugin.func = sandbox.stub();
              plugin.install();
              expect(plugin.func)
                .to
                .have
                .been
                .calledWithExactly(plugin.api, plugin.opts);
            });

            it(`should emit "waiting"`, () => {
              expect(() => plugin.install())
                .to
                .emitFrom(plugin, 'waiting');
            });

            it(`should emit "installing"`, () => {
              expect(() => plugin.install())
                .to
                .emitFrom(plugin, 'installing');
            });

            it(`should emit "installed"`, () => {
              expect(() => plugin.install())
                .to
                .emitFrom(plugin, 'installed');
            });

            it(`should set state to "installed"`, () => {
              plugin.install();
              expect(plugin.state)
                .to
                .equal('installed');
              expect(plugin.installed).to.be.true;
            });
          });

          describe(`if already installed`, () => {
            beforeEach(() => {
              plugin.state = 'installed';
            });

            it(`should throw`, () => {
              plugin.func = sandbox.stub();
              expect(() => plugin.install())
                .to
                .throw(Error, /invalid/i);
            });
          });
        });
      });
    });
  });
});
