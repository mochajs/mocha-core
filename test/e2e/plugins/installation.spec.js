'use strict';

import {Pluggable} from '../../../src/plugins';
import {Graphable} from '../../../src/core';

describe(`e2e/plugins/installation`, () => {
  let pluggable;
  let plugin;

  describe(`when using a plugin with no dependencies`, () => {
    beforeEach(() => {
      pluggable = Pluggable({depGraph: Graphable()});
      plugin = function () {
      };
      plugin.attributes = {name: 'foo'};
    });

    it(`should install the plugin`, () => {
      pluggable.use(plugin);
      console.log('used');

      expect(pluggable.plugins.get(plugin.attributes.name))
        .to
        .have
        .property('name', 'foo');
    });
  });

  describe(`when using a plugin with dependencies`, () => {
    let dep;

    beforeEach(() => {
      pluggable = Pluggable({depGraph: Graphable()});
      plugin = function () {
      };
      plugin.attributes =
      {
        name: 'foo',
        dependencies: ['bar']
      };

      dep = function () {
      };
      dep.attributes = {
        name: 'bar'
      };
    });

    it(`should not immediately install the plugin if the deps are not installed`,
      () => {
        pluggable.use(plugin);
        expect(pluggable.plugins.has(plugin.attributes.name)).to.be.false;
      });

    it(`should install the plugin once the deps are installed`, () => {
      pluggable.use(plugin);
      pluggable.use(dep);

      expect(pluggable.plugins.get(plugin.attributes.name))
        .to
        .have
        .property('name', 'foo');
    });
  });
});
