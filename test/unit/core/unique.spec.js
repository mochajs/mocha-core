'use strict';

describe(`core/unique`, () => {
  const Unique = require('../../../src/core/unique');

  describe(`Unique()`, () => {
    describe(`init()`, () => {
      it(`should return an object`, () => {
        expect(Unique()).to.be.an('object');
      });

      it(`should assign a unique ID to the object`, () => {
        expect(Unique()[Unique.idProp]).to.be.a('symbol');
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
