'use strict';

import Loader, {
  resolve,
  assertResolved,
  normalize,
  assertAttributes,
  assertUnused,
  build
} from '../../../src/plugins/loader';
import {EventEmittable} from '../../../src/core';

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

    Loader.__Rewire__('resolver', stubs.resolver);
    Loader.__Rewire__('usedPlugins', {
      add: stubs.usedPlugins.add,
      has: stubs.usedPlugins.has
    });
  });

  afterEach(() => {
    Loader.__ResetDependency__('resolver');
    Loader.__ResetDependency__('usedPlugins');
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

    it('should throw an error if "func" is not present', () => {
      expect(assertResolved)
        .to
        .throw(Error, /could not resolve/i);
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

    it('should throw if no string "func.attributes.name" prop in "opts" parameter',
      () => {
        const opts = {func: noop};
        opts.func.attributes = {name: {}};
        expect(() => assertAttributes(opts))
          .to
          .throw(Error, /"name" property/i);
      });

    it('should not throw if string "func.attributes.name" prop is present in "opts" parameter',
      () => {
        const opts = {func: noop};
        opts.func.attributes = {name: 'foo'};
        expect(() => assertAttributes(opts))
          .not
          .to
          .throw();
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

    it('should not throw if the plugin is not already loaded', () => {
      expect(() => assertUnused(stubs.usedPlugins, opts))
        .not
        .to
        .throw(Error, /already used/i);
    });

    it('should throw if the plugin is already loaded', () => {
      stubs.usedPlugins = new Set();
      stubs.usedPlugins.add(opts.func.attributes.name);
      expect(() => assertUnused(stubs.usedPlugins, opts))
        .to
        .throw(Error, /already used/i);
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
      Loader.__Rewire__('Plugin', PluginStub);
    });

    afterEach(() => {
      Loader.__ResetDependency__('Plugin');
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

  describe('Loader()', () => {
    beforeEach(() => {
      [
        resolve,
        normalize,
        assertResolved,
        assertAttributes,
        assertUnused
      ].forEach(fn => Loader.__Rewire__(fn.name, sandbox.stub()
        .returnsArg(0)));
    });

    afterEach(() => {
      [
        resolve,
        normalize,
        assertResolved,
        assertAttributes,
        assertUnused
      ].forEach(fn => Loader.__ResetDependency__(fn.name));
    });
  });
});
