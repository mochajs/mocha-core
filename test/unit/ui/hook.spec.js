'use strict';

describe('ui/hook', () => {
  const Hook = require('../../../src/ui/hook');

  describe(`Hook()`, () => {
    it('should be a function', () => {
      expect(Hook).to.be.a('function');
    });

    it(`should return an object`, () => {
      expect(Hook()).to.be.an('object');
    });
  });
});
