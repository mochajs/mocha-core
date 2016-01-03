'use strict';

const SYMBOL = global.Symbol ? 'Symbol' : 'Object';

describe(`core/unique`, () => {
  const Unique = require('../../../../src/core/base/unique');

  describe(`Unique()`, () => {
    it(`should return an object with a Symbol "id" property`, () => {
      expect(Unique().id)
        .to
        .be
        .a(SYMBOL);
    });

    it(`should assign an id to objects created by stamps composed from this stamp`,
      () => {
        expect(Unique.methods({
          foo() {
          }
        })().id)
          .to
          .be
          .a(SYMBOL);
      });
  });
});
