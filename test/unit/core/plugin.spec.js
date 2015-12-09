'use strict';

const noop = require('lodash/utility/noop');
const Promise = require('bluebird');

describe(`core/plugin`, () => {
  const Plugin = require('../../../src/core/plugin');

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/plugin');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Plugin()`, () => {
    describe(`init()`, () => {
      it(`should throw if no "name" passed`, () => {
        expect(Plugin).to.throw(Error, /"name"/);
      });

      it(`should throw if no "func" passed`, () => {
        expect(() => Plugin({
          name: 'foo'
        })).to.throw(Error, /"func"/);
      });

      it(`should throw if non-string "name" passed`, () => {
        expect(() => Plugin({
          name: []
        })).to.throw(Error, /"name"/);
      });

      it(`should throw if non-function "func" passed`, () => {
        expect(() => Plugin({
          name: 'foo',
          func: {}
        })).to.throw(Error, /"func"/);
      });

      it(`should throw if "dependencies" is a non-Array, non-string value`,
        () => {
          expect(() => Plugin({
            name: 'foo',
            func: noop,
            dependencies: null
          })).to.throw(Error, /"dependencies"/);
        });

      it(`should throw if "api" is a non-object`, () => {
        expect(() => Plugin({
          name: 'foo',
          func: noop,
          api: null
        })).to.throw(Error, /"api"/);
      });

      it(`should not throw if "dependencies" is a string value`, () => {
        expect(() => Plugin({
          name: 'foo',
          func: noop,
          dependencies: 'bar',
          api: {}
        })).not.to.throw();
      });

      it(`should not throw if "dependencies" is an Array value`, () => {
        expect(() => Plugin({
          name: 'foo',
          func: noop,
          dependencies: ['bar', 'baz'],
          api: {}
        })).not.to.throw();
      });

      it(`should not throw if no "dependencies" are passed`, () => {
        expect(() => Plugin({
          name: 'foo',
          func: noop,
          api: {}
        })).not.to.throw();
      });

      it(`should ensure "func" returns a Promise`, () => {
        const plugin = Plugin({
          name: 'foo',
          func: noop,
          api: {}
        });

        return expect(plugin.func()).to.eventually.be.resolved;
      });

      it(`should store the original "func"`, () => {
        expect(Plugin({
          name: 'foo',
          func: noop,
          api: {}
        }).originalFunc).to.equal(noop);
      });
    });

    describe(`method`, () => {
      let plugin;
      let func;
      let api;

      beforeEach(() => {
        func = sandbox.stub().returns(Promise.resolve());
        api = {
          barf: noop
        };
        plugin = Plugin({
          name: 'foo',
          func: func,
          api: api
        });
        plugin.func = func;
      });

      describe(`load()`, () => {
        it(`should return a Promise`, () => {
          expect(plugin.load()).to.eventually.be.fulfilled;
        });

        describe(`if the plugin does not fail`, () => {
          it(`should call the plugin function`, () => {
            return plugin.load()
              .then(() => {
                expect(plugin.func).to.have.been.calledWith(plugin.api);
              });
          });

          it(`should emit "loaded"`, done => {
            plugin.on('loaded', data => {
              expect(data.name).to.equal('foo');
              done();
            });
            plugin.load();
          });
        });

        describe(`if the plugin fails to load`, () => {
          beforeEach(() => {
            plugin.func = sandbox.stub().returns(Promise.reject());
          });

          it(`should reject`, () => {
            return expect(plugin.load()).to.eventually.be.rejected;
          });
        });
      });
    });
  });
});
