'use strict';

describe(`core/reflectable`, () => {
  const Reflectable = require('../../../src/core/reflectable');

  describe(`Reflectable()`, () => {
    it(`should return an object with a "stampName" property of ` +
      `"Reflectable`, () => {
      expect(Reflectable().stampName)
        .to
        .equal('Reflectable');
    });

    describe(`static method`, () => {
      describe(`toString()`, () => {
        it(`should return a representation`, () => {
          expect(String(Reflectable))
            .to
            .equal('[stamp Reflectable]');
        });
      });

      describe(`stampName()`, () => {
        describe(`when called with a value`, () => {
          it(`should set the "stampName" property on the returned object`,
            () => {
              expect(Reflectable.stampName('foo')().stampName)
                .to
                .equal('foo');
            });

          it(`should return a new stamp`, () => {
            expect(Reflectable.stampName('foo'))
              .to
              .be
              .a('function');
          });
        });

        describe(`when called without a value`, () => {
          it(`should return the "stampName"`, () => {
            expect(Reflectable.stampName())
              .to
              .equal('Reflectable');
          });
        });
      });
    });
  });
});
