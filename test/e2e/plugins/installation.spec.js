import {Pluggable} from '../../../src/plugins';
import {Graphable} from '../../../src/core';

describe('e2e/plugins/installation', () => {
  let pluggable;
  let plugin;

  describe('when using a plugin with no dependencies', () => {
    beforeEach(() => {
      pluggable = Pluggable({depGraph: Graphable()});
      plugin = function myPlugin () {
      };
      plugin.attributes = {name: 'foo'};
    });

    describe('when the Plugin is ready', () => {
      it('should install the plugin', () => {
        pluggable.use(plugin);
        pluggable.ready();
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
  });

  describe('when using a plugin with dependencies', () => {
    let dep;

    beforeEach(() => {
      pluggable = Pluggable({depGraph: Graphable()});
      plugin = function myPlugin () {
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

    it('should provide a chainable use()', () => {
      expect(() => pluggable.use(plugin)
        .use(dep))
        .not
        .to
        .throw();
    });

    describe('and when the deps are not installed', () => {
      it('should not immediately install the plugin', () => {
        pluggable.use(plugin);
        expect(pluggable.plugins.size)
          .to
          .equal(0);
      });

      describe('and the Pluggable is ready', () => {
        it('should emit "error"', () => {
          expect(() => {
            pluggable.use(plugin);
            pluggable.ready();
          })
            .to
            .emitFrom(pluggable, 'error');
        });
      });
    });

    describe('and when the deps are installed', () => {
      it('should emit "done"', () => {
        expect(() => {
          pluggable.use(plugin);
          pluggable.use(dep);
          pluggable.ready();
        })
          .to
          .emitFrom(pluggable, 'done');
      });

      it('should put the installed plugin into the "plugins" Mappable', () => {
        pluggable.use(plugin)
          .use(dep);
        pluggable.ready();
        expect(pluggable.plugins.get(plugin.attributes.name))
          .to
          .have
          .property('name', plugin.attributes.name);
      });

      it('should put the installed dependency into the "plugins" Mappable',
        () => {
          pluggable.use(plugin)
            .use(dep);
          pluggable.ready();
          expect(pluggable.plugins.get(dep.attributes.name))
            .to
            .have
            .property('name', dep.attributes.name);
        });
    });
  });
});
