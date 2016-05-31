import {Pluggable} from '../../../src/plugins';
import PluginLoader from '../../../src/plugins/loader';

describe('plugins/pluggable', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('plugins/pluggable');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Pluggable()', () => {
    let pluggable;

    beforeEach(() => {
      pluggable = Pluggable();
    });

    it('should create a "loadedPlugins" property', () => {
      expect(pluggable)
        .to
        .have
        .property('loadedPlugins');
    });

    it('should create a "factory" property', () => {
      expect(pluggable)
        .to
        .have
        .property('factory', Pluggable);
    });

    it('should return an object', () => {
      expect(pluggable)
        .to
        .be
        .an('object');
    });

    it('should not create a "loader"', () => {
      expect(pluggable)
        .not
        .to
        .have
        .property('loader');
    });

    it('should have "ready" property "true"', () => {
      expect(pluggable)
        .to
        .have
        .property('ready', true);
    });

    function makePlugin (attributes = {}) {
      function plugin () {
      }

      plugin.attributes = attributes;
      return plugin;
    }

    describe('method', () => {
      let plugin;

      beforeEach(() => {
        plugin = makePlugin({name: 'foo'});
      });

      describe('use()', () => {
        beforeEach(() => {
          sandbox.stub(pluggable, 'load');
        });

        afterEach(() => {
          pluggable.emit('ready');
        });

        it('should not throw if no pattern supplied', () => {
          expect(() => pluggable.use())
            .not
            .to
            .throw();
        });

        it('should call "load"', () => {
          pluggable.use(plugin);
          expect(pluggable.load)
            .to
            .have
            .been
            .calledWithExactly({
              pattern: plugin,
              opts: {},
              api: pluggable
            });
        });

        it('should return the instance', () => {
          expect(pluggable.use(plugin))
            .to
            .equal(pluggable);
        });
      });

      describe('load()', () => {
        let opts;

        beforeEach(() => {
          sandbox.stub(PluginLoader.fixed.methods, 'load');
          opts = {};
          pluggable.load(opts);
        });

        describe('when no loader is present', () => {
          it('should instantiate one', () => {
            expect(pluggable.loader)
              .to
              .be
              .an('object');
          });
        });

        it('should call PluginLoader#load()', () => {
          expect(PluginLoader.fixed.methods.load)
            .to
            .have
            .been
            .calledWithExactly(opts);
        });

        describe('when PluginLoader instance emits "plugin-loader:plugin-loading"', () => {
          beforeEach(() => {
            pluggable.loader.emit('plugin-loader:plugin-loading');
          });

          it('should set its "ready" prop to "false"', () => {
            expect(pluggable)
              .to
              .have
              .property('ready', false);
          });

          describe('then when PluginLoader instance emits "plugin-loader:ready"', () => {
            beforeEach(() => {
              pluggable.loader.emit('plugin-loader:ready');
            });

            it('should set its "ready" prop to "true"', () => {
              expect(pluggable)
                .to
                .have
                .property('ready', true);
            });
          });
        });

        describe('when PluginLoader instance emits "error"', () => {
          let err;

          beforeEach(() => {
            err = new Error();
          });

          it('should also emit "error"', () => {
            expect(() => pluggable.loader.emit('error', err))
              .to
              .emitFrom(pluggable, 'error', err);
          });
        });

        describe('when PluginLoader emits "plugin-loader:plugin-loaded"', () => {
          let plugin;

          beforeEach(() => {
            plugin = {name: 'foo'};
          });

          it('should add the plugin to "loadedPlugins"', () => {
            pluggable.loader.emit('plugin-loader:plugin-loaded', plugin);
            expect(pluggable.loadedPlugins.has('foo')).to.be.true;
          });
        });

        describe('when PluginLoader emits "plugin-loader:ready"', () => {
          it('should set "ready" to true', () => {
            pluggable.loader.emit('plugin-loader:ready');
            expect(pluggable)
              .to
              .have
              .property('ready', true);
          });
        });
      });
    });
  });
});
