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

        it('should throw if no pattern supplied', () => {
          expect(() => pluggable.use())
            .to
            .throw(Error, /required/);
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
        let load;

        beforeEach(() => {
          load = sandbox.spy();
          Pluggable.__Rewire__('PluginLoader', PluginLoader.methods({load}));
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

        it('should set "ready" to false', () => {
          expect(pluggable)
            .to
            .have
            .property('ready', false);
        });

        it('should call PluginLoader#load()', () => {
          expect(load)
            .to
            .have
            .been
            .calledWithExactly(opts);
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

        describe('when PluginLoader emits "plugin-loaded"', () => {
          let plugin;

          beforeEach(() => {
            plugin = {name: 'foo'};
          });

          it('should add the plugin to "loadedPlugins"', () => {
            pluggable.loader.emit('plugin-loaded', plugin);
            expect(pluggable.loadedPlugins.has('foo')).to.be.true;
          });
        });

        describe('when PluginLoader emits "ready"', () => {
          it('should set "ready" to true', () => {
            pluggable.loader.emit('ready');
            expect(pluggable)
              .to
              .have
              .property('ready', true);
          });
        });

        afterEach(() => {
          Pluggable.__ResetDependency__('PluginLoader');
        });
      });
    });
  });
});
