import {EventEmittable} from '../../../src/core';
import {Plugin} from '../../../src/plugins';
import noop from 'lodash/noop';

describe('core/plugin', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/plugin');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Plugin()', () => {
    it('should not throw if "dependencies" is a string value', () => {
      expect(() => Plugin({
        name: 'foo',
        func: noop,
        dependencies: ['bar'],
        api: EventEmittable()
      }))
        .not
        .to
        .throw();
    });

    it('should not throw if "dependencies" is an Array value', () => {
      expect(() => Plugin({
        name: 'foo',
        func: noop,
        dependencies: [
          'bar',
          'baz'
        ],
        api: EventEmittable()
      }))
        .not
        .to
        .throw();
    });

    it('should not throw if no "dependencies" are passed', () => {
      expect(() => Plugin({
        name: 'foo',
        func: noop,
        api: EventEmittable(),
        dependencies: []
      }))
        .not
        .to
        .throw();
    });

    describe('member', () => {
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
          version: '1.0.0',
          dependencies: []
        });
        plugin.func = func;
      });

      describe('method', () => {
        describe('install()', () => {
          it('should return the Plugin instance', () => {
            expect(plugin.install())
              .to
              .equal(plugin);
          });

          describe('if not installed', () => {
            it('should install', () => {
              plugin.func = sandbox.stub();
              plugin.install();
              expect(plugin.func)
                .to
                .have
                .been
                .calledWith(plugin.api);
            });

            it('should set "installed" to be true', () => {
              plugin.install();
              expect(plugin)
                .to
                .have
                .property('installed', true);
            });
          });
        });
      });
    });
  });
});
