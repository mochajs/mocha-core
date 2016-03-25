'use strict';

import {Pluggable} from '../../../src/plugins';
import {Graphable} from '../../../src/core';

describe.skip('e2e/plugins/installation', () => {
  let pluggable;
  let plugin;

  describe('when using a plugin with no dependencies', () => {
    beforeEach(() => {
      pluggable = Pluggable({depGraph: Graphable()});
      plugin = function () {
      };
      plugin.attributes = {name: 'foo'};
    });

    afterEach(() => {
      pluggable.emit('ready');
    });

    it('should install the plugin', () => {
      pluggable.use(plugin);
      expect(pluggable.plugins.get(plugin.attributes.name))
        .to
        .be
        .an('object')
        .and
        .to
        .have
        .property('name', 'foo');
    });
  });

  describe('when using a plugin with dependencies', () => {
    let dep;

    beforeEach(() => {
      pluggable = Pluggable({depGraph: Graphable()});
      plugin = function () {
      };
      plugin.attributes = {
        name: 'foo',
        dependencies: ['bar']
      };

      dep = function () {
      };
      dep.attributes = {
        name: 'bar'
      };
    });

    afterEach(() => {
      pluggable.emit('ready');
    });

    describe('when the deps are not installed', () => {
      it('should not immediately install the plugin if the deps are not installed',
        () => {
          pluggable.use(plugin);
          expect(pluggable.plugins.has(plugin.attributes.name)).to.be.false;
        });

      it('should not emit "installed"', () => {
        expect(() => pluggable.use(plugin))
          .not
          .to
          .emitFrom(pluggable, 'installed');
      });
    });

    describe('when the deps are installed', () => {
      it('should emit "installed"', () => {
        pluggable.use(plugin);
        expect(() => pluggable.use(dep))
          .to
          .emitFrom(pluggable, 'installed');
      });

      it('should put the installed plugin into the "plugins" Mappable', () => {
        pluggable.use(plugin);
        pluggable.use(dep);

        expect(pluggable.plugins.get(plugin.attributes.name))
          .to
          .have
          .property('name', 'foo');
      });
    });
  });
});
