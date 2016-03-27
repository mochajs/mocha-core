import Singleton from '../../../src/core/singleton';

describe('core/singleton', () => {
  describe('Singleton()', () => {
    beforeEach(() => {
      Singleton.reset();
    });

    it('should return an object', () => {
      expect(Singleton())
        .to
        .be
        .an('object');
    });

    it('should return the same object upon subsequent calls', () => {
      const obj = Singleton();
      expect(Singleton())
        .to
        .equal(obj);
    });

    describe('when composed from', () => {
      it('should return the same object upon subsequent calls to the composed factory',
        () => {
          const MySingleton = Singleton.props({foo: 'bar'});
          const myObj = MySingleton();
          expect(MySingleton())
            .to
            .equal(myObj);
        });
    });

    describe('static', () => {
      describe('method', () => {
        describe('reset()', () => {
          it('should reset the internal container', () => {
            expect(Singleton.container).not.to.equal(Singleton.reset().container);
          });

          it('should return the factory', () => {
            expect(Singleton.reset()).to.equal(Singleton);
          });
        });
      });
    });
  });
});
