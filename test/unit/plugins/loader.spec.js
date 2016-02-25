'use strict';

import {
  resolve,
  assertResolved,
  normalize,
  assertAttributes,
  build,
  assertUnused,
  default as loader
} from '../../../src/plugins/loader';
import Plugin from '../../../src/plugins';

describe(`plugins/loader`, () => {
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
    stubs.usedPlugins.has = sandbox.stub();
    stubs.usedPlugins.has.onCall(0)
      .returns(false);
    stubs.usedPlugins.has.onCall(1)
      .returns(true);
    loader.__Rewire__('resolver', stubs.resolver);
    loader.__Rewire__('usedPlugins', {
      add: stubs.usedPlugins.add,
      has: stubs.usedPlugins.has
    });
  });

  afterEach(() => {
    loader.__ResetDependency__('resolver');
    loader.__ResetDependency__('usedPlugins');
    sandbox.restore();
  });

  describe(`resolve()`, () => {
    it(`should modify the object with the return value of resolver()`, () => {
      const opts = {pattern: 'foo'};
      resolve(opts);
      expect(opts.func)
        .to
        .equal(noop);
    });
  });

  describe(`assertResolve()`, () => {
    it(`should throw an error if "func" is not present`, () => {
      expect(assertResolved)
        .to
        .throw(Error, /could not resolve/i);
    });

    it(`should not change the value of "func"`, () => {
      const opts = {func: noop};
      expect(() => assertResolved(opts))
        .not
        .to
        .change(opts, 'func');
    });
  });

  describe(`normalize()`, () => {
    let opts;

    beforeEach(() => {
      sandbox.stub(Plugin, 'normalize')
        .returnsArg(0);
      opts = {func: noop};
    });

    it(`should defer to Plugin.normalize()`, () => {
      normalize(opts);
      expect(Plugin.normalize)
        .to
        .have
        .been
        .calledWithExactly(opts.func);
    });
  });

  describe(`assertAttributes()`, () => {
    it(`should throw if no string "func.attributes.name" prop in "opts" parameter`,
      () => {
        const opts = {func: noop};
        opts.func.attributes = {name: {}};
        expect(() => assertAttributes(opts))
          .to
          .throw(Error, /"name" property/i);
      });

    it(`should not throw if string "func.attributes.name" prop is present in "opts" parameter`,
      () => {
        const opts = {func: noop};
        opts.func.attributes = {name: 'foo'};
        expect(() => assertAttributes(opts))
          .not
          .to
          .throw();
      });

    it(`should not change the value of "func"`, () => {
      const opts = {func: noop};
      opts.func.attributes = {name: 'foo'};
      expect(() => assertAttributes(opts))
        .not
        .to
        .change(opts, 'func');
    });
  });

  describe(`assertUnused()`, () => {
    let opts;

    beforeEach(() => {
      opts = {func: noop};
      opts.func.attributes = {
        name: 'foo'
      };
    });

    it(`should not throw if the plugin is not already loaded`, () => {
      expect(() => assertUnused(opts))
        .not
        .to
        .throw();
    });

    it(`should throw if the plugin is already loaded`, () => {
      assertUnused(opts);
      expect(() => assertUnused(opts))
        .to
        .throw(Error, /already loaded/i);
    });
  });

  describe(`build()`, () => {
    let PluginStub;
    let opts;

    beforeEach(() => {
      PluginStub = sandbox.stub()
        .returnsArg(0);
      loader.__Rewire__('Plugin', PluginStub);
      opts = {
        func: noop,
        bar: 'baz'
      };
      opts.func.attributes = {name: 'foo'};
    });

    afterEach(() => {
      loader.__ResetDependency__('Plugin');
    });

    it(`should defer to Plugin()`, () => {
      build(opts);
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

    it(`should add the "name" value to "usedPlugins"`, () => {
      build(opts);
      expect(stubs.usedPlugins.add)
        .to
        .have
        .been
        .calledWithExactly(opts.func.attributes.name);
    });
  });
});
