'use strict';

import {Pluggable} from '../../../src/plugins';
import _ from 'highland';

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
      // depGraph is a singular object across all instances;
      // this ensures we get a new one each time.
      pluggable = Pluggable({depGraph: {}});
    });

    it(`should return an object`, () => {
      expect(pluggable)
        .to
        .be
        .an('object');
    });

    xit(`should initialize a plugin "use" stream`, () => {
      expect(_.isStream(pluggable.useStream)).to.be.true;
    });

    describe(`property`, () => {
      xdescribe(`useStream`, () => {
        it(`should emit "error" if an error received`, () => {
          const err = new Error();
          expect(() => pluggable.useStream.emit('error', err))
            .to
            .emitFrom(pluggable, 'error', err);
        });
      });
    });

    function makePlugin (attributes = {}) {
      function plugin () {
      }

      plugin.attributes = attributes;
      return plugin;
    }

    describe(`method`, () => {
      let plugin;

      beforeEach(() => {
        plugin = makePlugin({name: 'foo'});
      });

      describe(`use()`, () => {
        beforeEach(() => {
          pluggable.removeAllListeners('use');
        });

        it(`should emit "use"`, () => {
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

    describe(`event`, () => {
      describe(`use`, () => {
        let loader;

        beforeEach(() => {
          loader = sinon.stub()
            .returns(_());
          Pluggable.__Rewire__('loader', loader);
        });

        afterEach(() => {
          Pluggable.__ResetDependency__('loader');
        });

        describe(`when emitted`, () => {
          beforeEach(() => {
            pluggable.emit('use');
          });

          xit(`should initialize a plugin "load" stream`, () => {
            expect(_.isStream(pluggable.loadStream)).to.be.true;
          });

          xdescribe(`"load" stream`, () => {
            it(`should emit "error" on the Pluggable instance if it encounters one`,
              () => {
                const err = new Error();
                expect(() => pluggable.loadStream.emit('error', err))
                  .to
                  .emitFrom(pluggable, 'error', err);
              });
          });

          xit(`should pass the "use" stream as a parameter`, () => {
            expect(loader)
              .to
              .have
              .been
              .calledWithExactly(pluggable.useStream);
          });

          xdescribe(`and emitted again`, () => {
            it(`should not re-initialize the loading stream`, () => {
              expect(() => pluggable.emit('use'))
                .not
                .to
                .change(pluggable, 'loadStream');
            });
          });
        });
      });
    });
  });
});
