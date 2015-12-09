'use strict';

describe(`core/unique`, () => {
  const Unique = require('../../../src/core/unique');

  describe(`Unique()`, () => {
    describe(`init()`, () => {
      it(`should return an object`, () => {
        expect(Unique()).to.be.an('object');
      });
    });

    describe(`property`, () => {
      describe(`id`, () => {
        it(`should return the object's ID`, () => {
          expect(Unique().id).to.be.a('symbol');
        });
      });
    });
  });
});
