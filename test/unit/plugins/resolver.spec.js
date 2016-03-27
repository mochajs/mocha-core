import resolver, {load} from '../../../src/plugins/resolver';
import _, {noop} from 'lodash';
import pkg from '../../../src/options/package';

describe('plugins/resolver', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('plugins/resolver');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('load()', () => {
    describe('when called without a parameter', () => {
      it('should not throw', () => {
        expect(load)
          .not
          .to
          .throw();
      });

      it('should return nothing', () => {
        expect(load()).to.be.undefined;
      });
    });

    describe('when called with a non-Array parameter', () => {
      it('should not throw', () => {
        expect(() => load('foo'))
          .not
          .to
          .throw();
      });

      it('should return nothing', () => {
        expect(load('foo')).to.be.undefined;
      });
    });

    describe('when called with an Array', () => {
      describe('containing no items', () => {
        it('should not throw', () => {
          expect(() => load([]))
            .not
            .to
            .throw();
        });

        it('should return nothing', () => {
          expect(load([])).to.be.undefined;
        });
      });

      describe('containing a single item', () => {
        describe('which is an existent module path', () => {
          it('should successfully require() the module', () => {
            expect(load(['lodash']))
              .to
              .be
              .a('function');
          });
        });

        describe('which is an existent non-module path', () => {
          it('should not throw', () => {
            expect(() => load(['lodash/README.md']))
              .not
              .to
              .throw();
          });

          it('should return nothing', () => {
            expect(load(['lodash/README.md'])).to.be.undefined;
          });
        });
      });

      describe('containing multiple items', () => {
        describe('which are existent non-module paths', () => {
          it('should not throw', () => {
            expect(() => load([
              'lodash/README.md',
              'chai/README.md'
            ]))
              .not
              .to
              .throw();
          });

          it('should return nothing', () => {
            expect(load([
              'lodash/README.md',
              'chai/README.md'
            ])).to.be.undefined;
          });
        });

        describe('which are existent module paths', () => {
          it('should return the result of calling require() upon the first',
            () => {
              expect(load([
                'lodash',
                'chai'
              ]))
                .to
                .equal(_);
            });
        });

        describe('which contains a mix of existent module and non-module paths',
          () => {
            it('should return the result of require() upon the first valid module',
              () => {
                expect(load([
                  'lodash/README.md',
                  'lodash'
                ]))
                  .to
                  .equal(_);
              });
          });
      });
    });
  });

  describe('resolver()', () => {
    describe('when called without a parameter', () => {
      it('should not throw', () => {
        expect(resolver)
          .not
          .to
          .throw();
      });

      it('should return nothing', () => {
        expect(resolver()).to.be.undefined;
      });
    });

    describe('when called with a Function parameter', () => {
      it('should return the function', () => {
        expect(resolver(noop))
          .to
          .equal(noop);
      });
    });

    describe('when called with a string parameter', () => {
      const stubs = {};

      beforeEach(() => {
        stubs.load = sandbox.stub()
          .returns(_);
        stubs.resolveDep =
          sandbox.stub()
            .returns('lodash');
        resolver.__Rewire__('load', stubs.load);
        resolver.__Rewire__('resolveDep', stubs.resolveDep);
      });

      afterEach(() => {
        resolver.__ResetDependency__('load');
        resolver.__ResetDependency__('resolveDep');
      });

      it('should ask resolve-dep to find the module, which could be a plugin',
        () => {
          resolver('lodash');
          expect(stubs.resolveDep)
            .to
            .have
            .been
            .calledWithExactly([
              'lodash',
              `${pkg.name}-*-lodash`
            ]);
        });

      it('should pass the result to load()', () => {
        resolver('lodash');
        expect(stubs.load)
          .to
          .have
          .been
          .calledWithExactly('lodash');
      });

      it('should return the result of load()', () => {
        expect(resolver('lodash'))
          .to
          .equal(_);
      });
    });
  });
});
