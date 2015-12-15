'use strict';

describe(`core/unique`, () => {
  const Unique = require('../../../src/core/unique');

  describe(`Unique()`, () => {
    it(`should return an object with a Symbol "id" property`, () => {
      expect(Unique().id)
        .to
        .be
        .a('symbol');
    });
  });
});
