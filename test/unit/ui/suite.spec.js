'use strict';

describe('ui/suite', () => {
  const Suite = require('../../../src/ui/suite');

  describe(`Suite()`, () => {
    it('should be a function', () => {
      expect(Suite).to.be.a('function');
    });

    it(`should return an object`, () => {
      expect(Suite()).to.be.an('object');
    });
  });
});
