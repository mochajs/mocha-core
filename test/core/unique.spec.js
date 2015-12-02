'use strict';

describe(`core/unique`, () => {
  const Unique = require('../../src/core/unique');
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/unique');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Unique()`, () => {
    describe(`init()`, () => {
      it(`should return an object`, () => {
        expect(Unique()).to.be.an('object');
      });

      it(`should assign a unique ID to the object`, () => {
        expect(Unique().id).to.be.a('string');
      });
    });

    describe(`static method`, () => {
      describe(`generate()`, () => {
        it(`should generate a unique ID`, () => {
          expect(Unique.generate()).to.be.a('string');
        });
      });
    });
  });
});
