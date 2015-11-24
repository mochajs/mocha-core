'use strict';

describe('ui/context', () => {
  const Context = require('../../src/ui/context');

  describe(`Context()`, () => {
    it('should be a function', () => {
      expect(Context).to.be.a('function');
    });

    it(`should return an object`, () => {
      expect(Context()).to.be.an('object');
    });
  });
});
