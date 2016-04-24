import {Pluggable} from '../../../src/plugins';

describe('e2e/plugins/installation', () => {
  let pluggable;
  let plugin;

  describe('when using a plugin with no dependencies', () => {
    beforeEach(() => {
      pluggable = Pluggable();
      plugin = function myPlugin () {
      };
      plugin.attributes = {name: 'foo'};
    });

    describe('when the Plugin is ready', () => {
      it('should install the plugin', () => {
        pluggable.use(plugin);
        expect(pluggable.loadedPlugins.get(plugin.attributes.name))
          .to
          .be
          .an('object')
          .and
          .to
          .have
          .property('name', 'foo');
      });

      it('should set "ready" to true', () => {
        expect(pluggable)
          .to
          .have
          .property('ready', true);
      });
    });
  });

  describe('when using a plugin with dependencies', () => {
    let dep;

    beforeEach(() => {
      pluggable = Pluggable();
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
      beforeEach(() => {
        pluggable.use(plugin);
      });

      it('should not immediately install the plugin', () => {
        expect(pluggable)
          .to
          .have
          .deep
          .property('loadedPlugins.size', 0);
      });

      it('should set "ready" to be false', () => {
        expect(pluggable)
          .to
          .have
          .property('ready', false);
      });

      describe('and the Pluggable is ready', () => {
        it('should emit "error"', () => {
          expect(() => {
            pluggable.use(plugin);
          })
            .to
            .emitFrom(pluggable, 'error');
        });
      });
    });

    describe('and when the deps are installed', () => {
      beforeEach(() => {
        pluggable.use(plugin)
          .use(dep);
      });

      it('should set "ready" to true', () => {
        expect(pluggable)
          .to
          .have
          .property('ready', true);
      });

      it('should put the installed plugin into the "loadedPlugins" Mappable',
        () => {
          expect(pluggable.loadedPlugins.get(plugin.attributes.name))
            .to
            .have
            .property('name', plugin.attributes.name);
        });

      it('should put the installed dependency into the "loadedPlugins" Mappable',
        () => {
          expect(pluggable.loadedPlugins.get(dep.attributes.name))
            .to
            .have
            .property('name', dep.attributes.name);
        });
    });

    describe('and the plugin throws upon install', () => {
      let err;

      beforeEach(() => {
        err = new Error();
        plugin = function myPlugin () {
          throw err;
        };
        plugin.attributes = {
          name: 'foo'
        };
      });

      it('should emit "error"', () => {
        expect(() => pluggable.use(plugin))
          .to
          .emitFrom(pluggable, 'error', err);
      });
    });
  });
});
