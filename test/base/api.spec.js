'use strict';

describe(`core/api`, () => {
  const API = require('../../src/core/api');
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/api');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`API()`, () => {
    it(`should be a function`, () => {
      expect(API).to.be.a('function');
    });

    describe(`init()`, () => {
      it(`should return an object`, () => {
        expect(API()).to.be.an('object');
      });
    });

    describe(`method`, () => {
      describe(`version()`, () => {
        it(`should return the package version if none specified`, () => {
          const pkg = require('../../package.json');
          expect(API().version()).to.equal(pkg.version);
        });

        it(`should return the version if specified`, () => {
          expect(API({__version: '0.1.2'}).version()).to.equal('0.1.2');
        });
      });

      describe(`load()`, () => {
        it(`should defer to the PluginLoader`, () => {
          const api = API();
          sandbox.stub(api.loader, 'load');
          api.load();
          expect(api.loader.load).to.have.been.calledOnce;
        });
      });

      describe(`use()`, () => {
        it(`should `, () => {
          
        });
      });
    });
  });
});
