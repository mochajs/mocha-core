import resolver from '../../../src/plugins/resolver';
import PluginLoader, {
  resolve, assertResolved, normalize, assertAttributes, assertUnused, build
} from '../../../src/plugins/loader';
import {Plugin} from '../../../src/plugins';
import {Kefir} from 'kefir';

describe('plugins/loader', () => {
  let sandbox;
  let noop;

  beforeEach(() => {
    noop = () => {
    };
    sandbox = sinon.sandbox.create('plugins/loader');
    sandbox.stub(resolver, 'resolve')
      .returns(noop);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('resolve()', () => {
    let opts;

    beforeEach(() => {
      opts = {pattern: 'foo'};
    });

    it('should be an object having "func" property as returned by resolver()',
      () => {
        expect(resolve(opts))
          .to
          .have
          .property('func', noop);
      });

    it('should not return the identity', () => {
      expect(resolve(opts))
        .not
        .to
        .equal(opts);
    });
  });

  describe('assertResolve()', () => {
    let opts;

    beforeEach(() => {
      opts = {func: noop};
    });

    it('should return the identity', () => {
      expect(assertResolved(opts))
        .to
        .equal(opts);
    });

    it('should return an error if "func" is not present', () => {
      expect(assertResolved())
        .be
        .an('Error');
    });

    it('should not change the value of "func"', () => {
      expect(() => assertResolved(opts))
        .not
        .to
        .change(opts, 'func');
    });
  });

  describe('normalize()', () => {
    it('should return the identity', () => {
      const opts = {
        func: {
          attributes: {
            name: 'foo'
          }
        }
      };

      expect(normalize(opts))
        .to
        .equal(opts);
    });

    it('should modify the attributes in place', () => {
      const opts = {
        func: {
          attributes: {
            name: 'foo'
          }
        }
      };
      expect(() => normalize(opts))
        .to
        .change(opts.func, 'attributes');
    });

    it('should create Array prop "dependencies"', () => {
      const opts = {
        func: {
          attributes: {
            name: 'foo'
          }
        }
      };
      normalize(opts);
      expect(opts.func.attributes.dependencies)
        .to
        .be
        .an('array');
    });

    it('should coerce string "dependencies" into an Array', () => {
      const opts = {
        func: {
          attributes: {
            name: 'foo',
            dependencies: 'bar'
          }
        }
      };
      normalize(opts);
      expect(opts.func.attributes.dependencies)
        .to
        .be
        .an('array');
    });

    describe('if property "pkg" is present', () => {
      it('should pull property "name"', () => {
        const opts = {
          func: {
            attributes: {
              pkg: {
                name: 'foo'
              }
            }
          }
        };
        normalize(opts);
        expect(opts)
          .to
          .have
          .deep
          .property('func.attributes.name', 'foo');
      });

      it('should pull property "description"', () => {
        const opts = {
          func: {
            attributes: {
              pkg: {
                description: 'foo'
              }
            }
          }
        };
        normalize(opts);
        expect(opts)
          .to
          .have
          .deep
          .property('func.attributes.description', 'foo');
      });

      it('should pull property "version"', () => {
        const opts = {
          func: {
            attributes: {
              pkg: {
                version: 'foo'
              }
            }
          }
        };
        normalize(opts);
        expect(opts)
          .to
          .have
          .deep
          .property('func.attributes.version', 'foo');
      });

      describe('if a "name" field is already present', () => {
        it('should not overwrite it', () => {
          const opts = {
            func: {
              attributes: {
                name: 'foo',
                pkg: {
                  name: 'bar'
                }
              }
            }
          };
          normalize(opts);
          expect(opts)
            .to
            .have
            .deep
            .property('func.attributes.name', 'foo');
        });
      });
    });
  });

  describe('assertAttributes()', () => {
    it('should return the identity', () => {
      const opts = {func: noop};
      opts.func.attributes = {name: 'foo'};

      expect(assertAttributes(opts))
        .to
        .equal(opts);
    });

    it(
      'should return an Error if no string "func.attributes.name" prop in "opts" parameter',
      () => {
        const opts = {func: noop};
        opts.func.attributes = {name: {}};
        expect(assertAttributes(opts))
          .to
          .be
          .an('Error');
      });

    it(
      'should not return an Error if string "func.attributes.name" prop is present in "opts" parameter',
      () => {
        const opts = {func: noop};
        opts.func.attributes = {name: 'foo'};
        expect(assertAttributes(opts))
          .not
          .to
          .be
          .an('Error');
      });

    it('should not change the value of "func"', () => {
      const opts = {func: noop};
      opts.func.attributes = {name: 'foo'};
      expect(() => assertAttributes(opts))
        .not
        .to
        .change(opts, 'func');
    });
  });

  describe('assertUnused()', () => {
    let opts;
    let unloadedPlugins;

    beforeEach(() => {
      opts = {func: noop};
      opts.func.attributes = {
        name: 'foo'
      };
      unloadedPlugins = new Set();
    });

    it('should return an Error if the plugin is already loaded', () => {
      unloadedPlugins.add(opts.func.attributes.name);
      expect(assertUnused(unloadedPlugins, opts))
        .to
        .be
        .an('Error');
    });

    it('should return the identity', () => {
      expect(assertUnused(unloadedPlugins, opts))
        .to
        .equal(opts);
    });
  });

  describe('build()', () => {
    let opts;
    let unloadedPlugins;
    let pluginSpy;

    beforeEach(() => {
      opts = {
        func: noop,
        bar: 'baz'
      };
      opts.func.attributes = {name: 'foo'};
      unloadedPlugins = new Set();
      pluginSpy = sandbox.spy();
      Plugin.fixed.init.push(pluginSpy);
      sandbox.spy(unloadedPlugins, 'add');
    });

    afterEach(() => {
      Plugin.fixed.init.pop();
    });

    it('should not return the identity', () => {
      expect(build(unloadedPlugins, opts))
        .not
        .to
        .equal(opts);
    });

    it('should defer to Plugin()', () => {
      build(unloadedPlugins, opts);
      expect(pluginSpy)
        .to
        .have
        .been
        .calledOnce;
    });

    it('should add the "name" value to "unloadedPlugins"', () => {
      build(unloadedPlugins, opts);
      expect(unloadedPlugins.add)
        .to
        .have
        .been
        .calledWithExactly(opts.func.attributes.name);
    });
  });

  describe('PluginLoader()', () => {
    let loader;

    beforeEach(() => {
      loader = PluginLoader();
    });

    it('should create Stream prop "loadStream"', () => {
      expect(loader.loadStream)
        .to
        .be
        .an
        .instanceOf(Kefir.Stream);
    });

    it('should create Stream Emitter "loadEmitter"', () => {
      expect(loader.loadEmitter)
        .to
        .be
        .an('object')
        .with
        .keys('value', 'error', 'end', 'event', 'emit', 'emitEvent');
    });

    describe('property', () => {
      describe('loadStream', () => {
        describe('when it encounters an error', () => {
          it('should emit "error" from the Pluginloader', () => {
            const err = new Error('foo');
            expect(() => loader.loadEmitter.error(err))
              .to
              .emitFrom(loader, 'error', err);
          });
        });
      });
    });

    describe('method', () => {
      describe('load', () => {
        beforeEach(() => {
          sandbox.stub(loader.loadEmitter, 'emit');
        });

        describe('when supplied a parameter', () => {
          it(
            'should call the "emit" method of the loadEmitter with its parameter',
            () => {
              loader.load('foo');
              expect(loader.loadEmitter.emit)
                .to
                .have
                .been
                .calledWithExactly('foo');
            });
        });

        describe('when not supplied a parameter', () => {
          it(
            'should call the "emit" method of the loadEmitter with an empty object',
            () => {
              const obj = {};
              loader.load(obj);
              expect(loader.loadEmitter.emit)
                .to
                .have
                .been
                .calledWithExactly(obj);
            });
        });
      });
    });
  });
});
