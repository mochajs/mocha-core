'use strict';

import * as Plugins from '../../../src/plugins';
import Graphable from '../../../src/core/graphable';
import _ from 'highland';

const {Plugin, Pluggable} = Plugins;

describe(`core/pluggable`, () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/pluggable');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Pluggable()`, () => {
    let pluggable;

    beforeEach(() => {
      pluggable = Pluggable({depGraph: Graphable()});
    });

    it(`should return an object`, () => {
      expect(pluggable)
        .to
        .be
        .an('object');
    });

    it(`should initialize a Stream "pluginStream"`, () => {
      expect(_.isStream(pluggable.pluginStream)).to.be.true;
    });

    it(`should initialize a Stream "loaderStream"`, () => {
      expect(_.isStream(pluggable.loaderStream)).to.be.true;
    });

    describe(`property`, () => {
      describe(`pluginStream`, () => {
        it(`should emit "error" if an error received`, () => {
          expect(() => pluggable.pluginStream.emit('error', new Error()))
            .to
            .emitFrom(pluggable, 'error');
        });
      });
    });

    function makePlugin (attributes = {}) {
      function plugin () {
      }

      plugin.attributes = Plugin.normalize({attributes});
      return plugin;
    }

    describe(`method`, () => {
      let plugin;

      beforeEach(() => {
        plugin = makePlugin({name: 'foo'});
      });

      describe(`use()`, () => {
        it(`should emit "use"`, () => {
          // stub this so we don't end up calling the loader
          pluggable.pluginStream = _();
          expect(() => pluggable.use(plugin))
            .to
            .emitFrom(pluggable, 'use', {
              pattern: plugin,
              opts: {},
              depGraph: pluggable.depGraph,
              api: pluggable
            });
        });

        it(`should return the instance`, () => {
          expect(pluggable.use(plugin))
            .to
            .equal(pluggable);
        });
      });
    });
  });
});
