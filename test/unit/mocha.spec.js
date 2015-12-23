'use strict';

describe(`mocha`, () => {
  const Mocha = require('../../src/mocha');
  let sandbox;
  let mocha;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('mocha');
    mocha = Mocha.methods({use: sandbox.stub()})();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Mocha()`, () => {
    it(`should use the default ui`, () => {
      expect(mocha.use)
        .to
        .have
        .been
        .calledWithExactly(mocha.ui);
    });
  });

  describe(`method`, () => {
    describe(`expose()`, () => {
      it(`should mix a prototype into the instance`, () => {

      });
    });
  });
});
