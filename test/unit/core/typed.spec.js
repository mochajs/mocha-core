import {typed} from '../../../src/core';
import is from 'check-more-types';

describe('core/typed', () => {
  describe('typed()', () => {
    let Factory;

    beforeEach(() => {
      Factory = typed();
    });

    describe('return value', () => {
      it('should be a function', () => {
        expect(Factory)
          .to
          .be
          .a('function');
      });
    });

    describe('Factory result', () => {
      let obj;

      beforeEach(() => {
        obj = Factory();
      });

      it('should have a Set property "__types__"', () => {
        expect(obj)
          .to
          .have
          .property('__types__')
          .that
          .is
          .a('Set');
      });
    });

    describe('mixin', () => {
      it('should create a check-more-types mixin for the default type', () => {
        expect(is.factory)
          .to
          .be
          .a('function');
      });

      describe('when specifying a custom type', () => {
        let CustomType;

        beforeEach(() => {
          CustomType = typed('CustomType');
        });

        it('should create a check-more-types mixin for the custom type', () => {
          expect(is.customType)
            .to
            .be
            .a('function');
        });

        describe('when created', () => {
          describe('the resulting object', () => {
            let obj;

            beforeEach(() => {
              obj = CustomType();
            });

            it('should be of type "customType"', () => {
              expect(is.customType(obj)).to.be.true;
            });

            it('should not be of type "factory"', () => {
              expect(is.factory(obj)).to.be.false;
            });
          });
        });

        describe('when composed', () => {
          describe('the resulting object', () => {
            let customObj;

            beforeEach(() => {
              customObj = Factory.compose(CustomType)();
            });

            it('should be of type "customType"', () => {
              expect(is.customType(customObj)).to.be.true;
            });

            it('should be of type "factory"', () => {
              expect(is.factory(customObj)).to.be.true;
            });

            describe('and factory it was composed from', () => {
              let obj;

              beforeEach(() => {
                obj = Factory();
              });
              
              it('should be of type "factory"', () => {
                expect(is.factory(obj)).to.be.true;
              });

              it('should not be of type "customType"', () => {
                expect(is.customType(obj)).to.be.false;
              });
            });
          });
        });
      });
    });
  });
});
