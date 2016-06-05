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
      describe('method', () => {
        describe('toString()', () => {
          describe('when the object has no "id" nor "title" prop', () => {
            let obj;

            beforeEach(() => {
              obj = Factory();
            });

            it('should return a plain representation', () => {
              expect(String(obj))
                .to
                .equal('<Factory>');
            });
          });

          describe('when the object has an "id" prop, but not a "title" prop',
            () => {
              let obj;

              beforeEach(() => {
                obj = Factory({id: 'foo'});
              });

              it('should return a representation w/ the id', () => {
                expect(String(obj))
                  .to
                  .equal('<Factory#foo>');
              });
            });

          describe('when the object has an "id" prop and a "title" prop',
            () => {
              let obj;

              beforeEach(() => {
                obj = Factory({
                  id: 'foo',
                  title: 'bar'
                });
              });

              it('should return a representation w/ the id and title', () => {
                expect(String(obj))
                  .to
                  .equal('<Factory#foo:"bar">');
              });
            });

          describe('when the object has no "id" prop but a "title" prop',
            () => {
              let obj;

              beforeEach(() => {
                obj = Factory({
                  title: 'bar'
                });
              });

              it('should return a representation w/ the title', () => {
                expect(String(obj))
                  .to
                  .equal('<Factory:"bar">');
              });
            });
        });
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
