'use strict';

const Joi = require('joi');

describe(`core/param-validator`, () => {
  const ParamValidator = require('../../../src/core/param-validator');

  describe(`ParamValidator()`, () => {
    describe(`return value`, () => {
      it(`should be an object`, () => {
        expect(ParamValidator())
          .to
          .be
          .an('object');
      });

      it(`should have a "stampName" property of "ParamValidator"`, () => {
        expect(ParamValidator().stampName)
          .to
          .equal('ParamValidator');
      });
    });

    describe(`static method`, () => {
      describe(`validate()`, () => {
        describe(`if passed empty "options"`, () => {
          it(`should throw`, () => {
            expect(() => ParamValidator.validate())
              .to
              .throw(Error, /"options"/);
          });
        });

        it(`should return a function (stamp)`, () => {
          expect(ParamValidator.validate({
            init() {
            }
          }, {init: [Joi.string()]}))
            .to
            .be
            .a('function');
        });

        describe(`if passed an "init()" function in options and schema`, () => {
          it(`should add an "init()" function to the stamp`, () => {
            function init() {
            }

            const initCount = ParamValidator.fixed.init.length;
            const stamp = ParamValidator.validate({init}, {
              init: [Joi.string()]
            });
            expect(stamp.fixed.init.length)
              .to
              .equal(initCount + 1);
          });

          it(`should add a proxy "init()" function to the stamp`, () => {
            function init() {
            }

            const stamp = ParamValidator.validate({init}, {
              init: [Joi.string()]
            });
            const initProxy = stamp.fixed.init.pop();
            expect(initProxy)
              .to
              .be
              .a('function');

            // this assertion is pretty poor
            expect(initProxy)
              .not
              .to
              .equal(init);
            expect(initProxy.name)
              .to
              .equal('validationProxy');
          });
        });

        describe(`if passed "props" value in options`, () => {
          it(`should add a property to the stamp`, () => {
            const stamp = ParamValidator.validate({
              props: {
                foo: 'bar'
              }
            });
            expect(stamp.fixed.props.foo)
              .to
              .equal('bar');
          });

          describe(`if passed a function`, () => {
            it(`should pass it through to stampit`, () => {
              function foo() {
              }

              foo.bar = 'baz';
              const stamp = ParamValidator.validate({
                props: {foo}
              });
              // stampit creates an object if given a function
              // in "props"
              expect(stamp.fixed.props.foo)
                .to
                .be
                .an('object');
              expect(stamp.fixed.props.foo.bar)
                .to
                .equal('baz');
            });
          });
        });

        describe(`if passed "refs" value in options`, () => {
          it(`should add a property to the stamp`, () => {
            const stamp = ParamValidator.validate({
              refs: {
                foo: 'bar'
              }
            });
            expect(stamp.fixed.refs.foo)
              .to
              .equal('bar');
          });

          describe(`if passed a function`, () => {
            it(`should return a validation proxy`, () => {
              function foo() {
              }

              foo.bar = 'baz';
              const stamp = ParamValidator.validate({
                refs: {foo}
              });
              const refs = stamp.fixed.refs;
              expect(refs.foo)
                .to
                .be
                .a('function');
              expect(refs.foo.bar)
                .to
                .equal('baz');
              expect(refs.foo)
                .to
                .equal(foo);
              expect(refs.foo.name)
                .not
                .to
                .equal('validationProxy');
            });
          });
        });

        describe(`if "methods" passed in options`, () => {
          describe(`if no schema passed`, () => {
            it(`should pass through`, () => {
              function foo() {
              }

              function bar() {
              }

              const stamp = ParamValidator.validate({
                methods: {
                  foo,
                  bar
                }
              });
              const methods = stamp.fixed.methods;
              expect(methods.foo)
                .to
                .equal(foo);
              expect(methods.bar)
                .to
                .equal(bar);
            });
          });

          describe(`if schema passed`, () => {
            it(`should create validation proxies for each`, () => {
              function foo() {
              }

              function bar() {
              }

              const stamp = ParamValidator.validate({
                methods: {
                  foo,
                  bar
                }
              }, {
                methods: {
                  foo: [Joi.string()],
                  bar: [Joi.string()]
                }
              });
              const methods = stamp.fixed.methods;
              expect(methods.foo)
                .not
                .to
                .equal(foo);
              expect(methods.foo.name)
                .to
                .equal('validationProxy');
              expect(methods.bar)
                .not
                .to
                .equal(bar);
              expect(methods.bar.name)
                .to
                .equal('validationProxy');
            });
          });
        });

        describe(`if "static" passed in options`, () => {

        });
      });
    });
  });
});
