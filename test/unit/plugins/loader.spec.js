import PluginLoader, {
  resolve, assertResolved, normalize, assertAttributes, assertUnused, build
} from '../../../src/plugins/loader';
import {EventEmittable} from '../../../src/core';
import {Kefir} from 'kefir';

describe('plugins/loader', () => {
  const stubs = {usedPlugins: {}};
  let sandbox;
  let noop;

  beforeEach(() => {
    noop = () => {
    };
    sandbox = sinon.sandbox.create('plugins/loader');
    stubs.resolver = sandbox.stub()
      .returns(noop);
    stubs.usedPlugins.add = sandbox.stub();
    stubs.usedPlugins.has = sandbox.stub()
      .returns(false);

    PluginLoader.__Rewire__('resolver', stubs.resolver);
    PluginLoader.__Rewire__('usedPlugins', {
      add: stubs.usedPlugins.add,
      has: stubs.usedPlugins.has
    });
  });

  afterEach(() => {
    PluginLoader.__ResetDependency__('resolver');
    PluginLoader.__ResetDependency__('usedPlugins');
    sandbox.restore();
  });

  describe('resolve()', () => {
    let opts;

    beforeEach(() => {
      opts = {pattern: 'foo'};
    });

    it('should an object having "func" property as returned by resolver()',
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

    beforeEach(() => {
      opts = {func: noop};
      opts.func.attributes = {
        name: 'foo'
      };
    });

    it('should not return an Error if the plugin is not already loaded', () => {
      expect(assertUnused(stubs.usedPlugins, opts))
        .not
        .to
        .be
        .an('Error');
    });

    it('should return an Error if the plugin is already loaded', () => {
      stubs.usedPlugins = new Set();
      stubs.usedPlugins.add(opts.func.attributes.name);
      expect(assertUnused(stubs.usedPlugins, opts))
        .to
        .be
        .an('Error');
    });

    it('should return the identity', () => {
      expect(assertUnused(stubs.usedPlugins, opts))
        .to
        .equal(opts);
    });
  });

  describe('build()', () => {
    let PluginStub;
    let opts;

    beforeEach(() => {
      opts = {
        func: noop,
        bar: 'baz'
      };
      opts.func.attributes = {name: 'foo'};
      PluginStub = sandbox.stub()
        .returns(EventEmittable(Object.assign({}, opts.func.attributes, opts)));
      PluginLoader.__Rewire__('Plugin', PluginStub);
    });

    afterEach(() => {
      PluginLoader.__ResetDependency__('Plugin');
    });

    it('should not return the identity', () => {
      expect(build(stubs.usedPlugins, opts))
        .not
        .to
        .equal(opts);
    });

    it('should defer to Plugin()', () => {
      build(stubs.usedPlugins, opts);
      expect(PluginStub)
        .to
        .have
        .been
        .calledWithExactly({
          name: 'foo',
          func: noop,
          bar: 'baz'
        });
    });

    it('should add the "name" value to "usedPlugins"', () => {
      build(stubs.usedPlugins, opts);
      expect(stubs.usedPlugins.add)
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

    it('should call reset()', () => {
      sandbox.spy(PluginLoader.fixed.methods, 'reset');
      PluginLoader();
      expect(PluginLoader.fixed.methods.reset).to.have.been.calledOnce;
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

    it('should listen for the "done" event', () => {
      sandbox.stub(PluginLoader.fixed.methods, 'once');
      PluginLoader();
      expect(PluginLoader.fixed.methods.once)
        .to
        .have
        .been
        .calledWith('done');
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

        describe('when it ends', () => {
          it('should emit "done" from the PluginLoader', () => {
            expect(() => loader.loadEmitter.end())
              .to
              .emitFrom(loader, 'done', loader.loadedPlugins);
          });
        });
      });
    });

    describe('event', () => {
      describe('done', () => {
        const arg = 'foo';

        beforeEach(() => {
          sandbox.stub(loader, 'onDone');
          sandbox.stub(loader, 'reset');
          loader.emit('done', arg);
        });

        it('should call the "onDone" function', () => {
          expect(loader.onDone)
            .to
            .have
            .been
            .calledWithExactly(arg);
        });

        it('should call reset()', () => {
          expect(loader.reset).to.have.been.calledOnce;
        });
      });
    });

    describe('method', () => {
      describe('reset', () => {
        describe('property "loadedPlugins"', () => {
          it('should be changed', () => {
            expect(() => loader.reset())
              .to
              .change(loader, 'loadedPlugins');
          });

          it('should be a Map', () => {
            loader.reset();
            expect(loader)
              .to
              .have
              .deep
              .property('loadedPlugins.constructor', Map);
          });
        });

        describe('property "seenPlugins"', () => {
          it('should be changed', () => {
            expect(() => loader.reset())
              .to
              .change(loader, 'seenPlugins');
          });

          it('should be a Set', () => {
            expect(loader)
              .to
              .have
              .deep
              .property('seenPlugins.constructor', Set);
          });
        });

        describe('property "unloadedPlugins"', () => {
          it('should be changed', () => {
            expect(() => loader.reset())
              .to
              .change(loader, 'unloadedPlugins');
          });

          it('should be a Set', () => {
            expect(loader)
              .to
              .have
              .deep
              .property('unloadedPlugins.constructor', Set);
          });
        });
      });

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

      describe('dump', () => {
        beforeEach(() => {
          sandbox.stub(loader.loadEmitter, 'end');
        });

        it('should call the "end" method of the loadEmitter', () => {
          loader.dump();
          expect(loader.loadEmitter.end).to.have.been.calledOnce;
        });
      });
    });
  });
});
