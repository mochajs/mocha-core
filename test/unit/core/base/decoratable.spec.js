'use strict';

describe(`core/base/decoratable`, () => {
  const Decoratable = require('../../../../src/core/base/decoratable');

  describe(`Decoratable()`, () => {
    it(`should return an Object with an Object "delegate" property`, () => {
      expect(Decoratable().delegate)
        .to
        .be
        .an('object');
    });

    describe(`method`, () => {
      describe(`decorate()`, () => {
        let decoratable;

        beforeEach(() => {
          decoratable = Decoratable();
          decoratable.decorate('foo', function(baz) {
            this.bar = baz;
          }, {
            context: decoratable,
            args: ['baz']
          });
        });

        it(`should return the decoratable`, () => {
          expect(decoratable.decorate('foo', function() {
          }))
            .to
            .equal(decoratable);
        });

        describe(`when passed a name, func and opts`, () => {
          it(`should decorate the delegate with a func by name`, () => {
            expect(decoratable.delegate.foo)
              .to
              .be
              .a('function');
          });

          it(`should bind the function to the Decoratable`, () => {
            decoratable.delegate.foo();
            expect(decoratable.bar)
              .to
              .equal('baz');
          });
        });
        describe(`when passed an array of objects`, () => {
          it(`should decorate the delegate with all of them`, () => {
            decoratable.decorate([
              {
                name: 'foo',
                func: function(baz) {
                  this.bar = baz;
                },
                opts: {
                  context: decoratable,
                  args: ['baz']
                }
              },
              {
                name: 'quux',
                func: function(foo) {
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
        describe(`when passed an object`, () => {
          it(`should use the keys as names and values as funcs (with default options)`,
            () => {
              decoratable.decorate({
                foo: function(baz) {
                  this.bar = baz;
                },
                quux: function(foo) {
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
    });
  });
});
