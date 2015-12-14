'use strict';

const noop = require('lodash/utility/noop');

describe(`core/api`, () => {
  const API = require('../../../src/core/api');
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/api');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`API()`, () => {
    describe(`init()`, () => {
      it(`should return an object`, () => {
        expect(API()).to.be.an('object');
      });

      it(`should return an object with a "plugins" Map`, () => {
        expect(API().plugins).to.be.a('Map');
      });
    });

    describe(`method`, () => {
      let api;

      beforeEach(() => {
        api = API();
      });

      describe(`use()`, () => {
        it(`should throw if not passed a plugin func`, () => {
          expect(() => api.use()).to.throw(Error, /"func"/);
        });

        it(`should throw if passed a non-object options`, () => {
          function foo() {}
          foo.attributes = {
            name: 'foo'
          };
          expect(() => api.use(foo, 'bar')).to.throw(Error, /"options"/);
        });

        it(`should throw if an invalid plugin is passed`, () => {
          expect(() => api.use(noop)).to.throw(Error, /"attributes"/);
        });
      });
    });
  });
});
