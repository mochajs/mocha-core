'use strict';

const repeat = require('lodash/string/repeat');

describe(`util/custom-error`, () => {
  const errorFactoryFactory = require('../../../src/util/custom-error');

  describe(`errorFactoryFactory()`, () => {
    beforeEach(() => {
      // reset registered errors
      errorFactoryFactory.errors = new Map();
    });

    it(`should return a function`, () => {
      expect(errorFactoryFactory('Bob')).to.be.a('function');
    });

    it(`should cache the factory functions`, () => {
      expect(errorFactoryFactory('Brenda'))
        .to
        .equal(errorFactoryFactory('Brenda'));
    });

    describe(`factory function`, () => {
      let Babadook;

      beforeEach(() => {
        Babadook = errorFactoryFactory('Babadook', {
          dook() {
            return repeat('dook', this.dooks);
          }
        });
      });

      it(`should return an Error`, () => {
        expect(Babadook()).to.be.an('Error');
      });

      describe(`when called with the "new" keyword`, () => {
        it(`should return an Error`, () => {
          expect(new Babadook()).to.be.an('Error');
        });
      });

      it(`should set the name of the Error`, () => {
        expect(Babadook().name).to.equal('Babadook');
      });

      it(`should accept a string message`, () => {
        expect(Babadook('dook').message).to.equal('dook');
      });

      it(`should have a stack trace`, () => {
        expect(Babadook().stack).to.be.a('string');
      });

      describe(`custom method`, () => {
        describe(`dook()`, () => {
          describe(`if no dooks specified`, () => {
            it(`should return an empty string`, () => {
              expect(Babadook().dook()).to.equal('');
            });
          });

          describe(`if dooks specified in factory call`, () => {
            it(`should return some dooks`, () => {
              expect(Babadook('dook', {dooks: 4}).dook())
                .to
                .equal('dookdookdookdook');
            });
            describe(`when not supplied a message`, () => {
              it(`should also return some dooks`, () => {
                expect(Babadook({dooks: 2}).dook()).to.equal('dookdook');
              });
            });
          });

          describe(`if dooks specified in factory creation`, () => {
            it(`should return some dooks as well`, () => {
              const Dadabook = errorFactoryFactory('Dadabook', {
                dooks: 3,
                dook() {
                  return repeat('dook', this.dooks);
                }
              });
              expect(Dadabook().dook()).to.equal('dookdookdook');
            });
          });
        });
      });
    });
  });
});
