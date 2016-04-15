import {Pluggable} from '../../../src/plugins';

describe('core/pluggable', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/pluggable');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Pluggable()', () => {
    let pluggable;

    beforeEach(() => {
      // depGraph is a singular object across all instances;
      // this ensures we get a new one each time.
      pluggable = Pluggable();
    });

    it('should return an object', () => {
      expect(pluggable)
        .to
        .be
        .an('object');
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

      describe.skip('use()', () => {
        beforeEach(() => {
          sandbox.stub(pluggable.loader, 'load');
        });

        afterEach(() => {
          pluggable.emit('ready');
        });

        it('should emit "error" if no pattern supplied', () => {
          expect(() => pluggable.use())
            .to
            .emitFrom(pluggable, 'error');
        });

        it('should emit "use"', () => {
          pluggable.use(plugin);
          expect(pluggable.loader.load).to.have.been.calledWithExactly({
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
    });
  });
});
