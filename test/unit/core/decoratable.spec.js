import Decoratable from '../../../src/core/decoratable';
import {noop} from 'lodash';

describe('core/decoratable', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/decoratable');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Decoratable()', () => {
    it('should return an Object with an Object "delegate" property', () => {
      expect(Decoratable().delegate)
        .to
        .be
        .an('object');
    });

    describe('method', () => {
      describe('decorate()', () => {
        let decoratable;

        beforeEach(() => {
          decoratable = Decoratable();
        });

        it('should return the decoratable', () => {
          expect(decoratable.decorate('foo', function () {
          }))
            .to
            .equal(decoratable);
        });

        describe('when passed a name, function and opts', () => {
          beforeEach(() => {
            decoratable.decorate('foo', function (baz) {
              this.bar = baz;
            }, {
              context: decoratable,
              args: ['baz']
            });
          });

          it('should decorate the delegate with a function by name', () => {
            expect(decoratable.delegate.foo)
              .to
              .be
              .a('function');
          });

          it('should bind the function to the Decoratable', () => {
            decoratable.delegate.foo();
            expect(decoratable.bar)
              .to
              .equal('baz');
          });
        });

        describe('when passed a name and a non-function value', () => {
          beforeEach(() => {
            decoratable.decorate('foo', 'bar');
          });

          it('should provide the value on the delegate', () => {
            expect(decoratable.delegate.foo)
              .to
              .equal('bar');
          });
        });

        describe('when passed an array of objects', () => {
          it('should decorate the delegate with all of them', () => {
            decoratable.decorate([
              {
                name: 'foo',
                func: function (baz) {
                  this.bar = baz;
                },
                opts: {
                  context: decoratable,
                  args: ['baz']
                }
              },
              {
                name: 'quux',
                func: function (foo) {
                  this.bar = foo;
                },
                opts: {
                  context: decoratable,
                  args: ['foo']
                }
              }
            ]);
            expect(decoratable.delegate.foo)
              .to
              .be
              .a('function');
            expect(decoratable.delegate.quux)
              .to
              .be
              .a('function');
            decoratable.delegate.foo();
            expect(decoratable.bar)
              .to
              .equal('baz');
            decoratable.delegate.quux();
            expect(decoratable.bar)
              .to
              .equal('foo');
          });
        });

        describe('when passed an object', () => {
          it(
            'should use the keys as names and values as funcs (with default options)',
            () => {
              decoratable.decorate({
                foo (baz) {
                  this.bar = baz;
                },
                quux (foo) {
                  this.bar = foo;
                }
              });
              expect(decoratable.delegate.foo)
                .to
                .be
                .a('function');
              expect(decoratable.delegate.quux)
                .to
                .be
                .a('function');
              decoratable.delegate.foo('baz');
              expect(decoratable.bar)
                .to
                .equal('baz');
              decoratable.delegate.quux('foo');
              expect(decoratable.bar)
                .to
                .equal('foo');
            });
        });
      });

      describe('alias', () => {
        let delegate;
        let decoratable;

        function result () {
        }

        beforeEach(() => {
          delegate = {foo: 'bar'};
          decoratable = Decoratable({delegate});
          sandbox.stub(decoratable, 'delegateResult')
            .returns(result);
          sandbox.spy(decoratable, 'setDelegateProp');
        });

        it('should call setDelegateProp', () => {
          decoratable.alias('foo', 'baz');
          expect(decoratable.setDelegateProp)
            .to
            .have
            .been
            .calledWithExactly('baz', result);
        });

        it('should call delegateResult', () => {
          decoratable.alias('foo', 'baz');
          expect(decoratable.delegateResult)
            .to
            .have
            .been
            .calledWithExactly('foo');
        });

        it('should create a property in the delegate', () => {
          decoratable.alias('foo', 'baz');
          expect(delegate)
            .to
            .have
            .property('baz', result);
        });

        it('should return the Decoratable', () => {
          expect(decoratable.alias('foo', 'baz'))
            .to
            .equal(decoratable);
        });
      });

      describe('delegateResult', () => {
        let delegate;
        let decoratable;

        beforeEach(() => {
          delegate = {foo: 'bar'};
          decoratable = Decoratable({delegate});
        });

        describe('when provided a non unempty string', () => {
          it('should return noop', () => {
            expect(decoratable.delegateResult())
              .to
              .equal(noop);
          });
        });

        describe('when provided a keypath', () => {
          describe('and the value at the keypath is undefined', () => {
            it('should return a function which returns undefined', () => {
              expect(decoratable.delegateResult('baz.quux')())
                .to
                .equal(undefined);
            });
          });

          describe('and the value at the keypath is defined', () => {
            beforeEach(() => {
              decoratable.decorate('baz.quux', 31337);
            });

            it('should return a function which returns the value at the keypath',
              () => {
                expect(decoratable.delegateResult('baz.quux')())
                  .to
                  .equal(31337);
              });
          });

          describe('and the value at the keypath is a function', () => {
            beforeEach(() => {
              decoratable.decorate('baz.quux', () => 'foo');
            });
            it(
              'should return a function which calls the function at the keypath',
              () => {
                expect(decoratable.delegateResult('baz.quux')())
                  .to
                  .equal('foo');
              });
          });
        });
      });

      describe('setDelegateProp', () => {
        let delegate;
        let decoratable;

        beforeEach(() => {
          delegate = {foo: 'bar'};
          decoratable = Decoratable({delegate});
        });

        it('should set a prop in the delegate', () => {
          decoratable.setDelegateProp('baz.quux', 31337);
          expect(delegate)
            .to
            .have
            .deep
            .property('baz.quux', 31337);
        });
      });

      describe('getDelegateProp', () => {
        let delegate;
        let decoratable;

        beforeEach(() => {
          delegate = {foo: 'bar'};
          decoratable = Decoratable({delegate});
          decoratable.setDelegateProp('baz.quux', 31337);
        });

        it('should get a prop in the delegate', () => {
          expect(decoratable.getDelegateProp('baz.quux'))
            .to
            .equal(31337);
        });
      });
    });
  });
});
