import _ from 'lodash';
import {UI as _UI, Suite, Test, Hook} from '../../../src/ui';
import {EventEmittable} from '../../../src/core';
import {Kefir} from 'kefir';

describe('ui/ui', () => {
  let sandbox;
  let delegate;
  let UI;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('ui/ui');
    sandbox.spy(Kefir, 'constant');
    delegate = EventEmittable({
      input$: Kefir.pool()
    });
    UI = _UI.refs({
      delegate,
      input$: delegate.input$
    });
    Suite.root.pre = [];
    Suite.root.post = [];
    Suite.root.preHooks = [];
    Suite.root.postHooks = [];
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('UI()', () => {
    describe('Observable', () => {
      let ui;

      beforeEach(() => {
        ui = UI();
        sandbox.stub(ui.delegate.input$, 'plug');
      });

      describe('suite$', () => {
        let suite$;

        beforeEach(() => {
          suite$ = ui.suite$;
          sandbox.stub(ui.dynamo$, 'combine')
            .returns(Kefir.constant());
        });

        it('should have set the UI\'s "context" prop upon instantiation"',
          () => {
            expect(ui.context)
              .to
              .equal(Suite.root.context);
          });

        describe('upon first child suite', () => {
          let suite;

          beforeEach(() => {
            suite = Suite();
          });

          it('should not emit "ui:suites:done"', () => {
            expect(() => suite$.plug(Kefir.constant(suite)))
              .not
              .to
              .emitFrom(ui, 'ui:suites:done');
          });

          it('should emit "ui:context"', () => {
            expect(() => suite$.plug(Kefir.constant(suite)))
              .to
              .emitFrom(ui, 'ui:context');
          });

          it('should set the UI\'s "context" prop', () => {
            suite$.plug(Kefir.constant(suite));
            expect(ui.context)
              .to
              .equal(suite.context);
          });

          describe('and when the root suite is again in context', () => {
            beforeEach(() => {
              suite$.plug(Kefir.constant(suite));
            });

            it('should reset the UI\'s "context" prop to the root context',
              () => {
                suite$.plug(Kefir.constant(Suite.root));
                expect(ui.context)
                  .to
                  .equal(Suite.root.context);
              });
          });
        });
      });

      describe('dynamo$', () => {
        let dynamo$;
        let Factory;
        let opts;
        let init;

        beforeEach(() => {
          opts = {};
          dynamo$ = ui.dynamo$;
          init = sandbox.spy();
        });

        describe('initial state', () => {
          describe('when plugged with a Suite', () => {
            let suite;
            let func;

            beforeEach(() => {
              func = sandbox.spy();
              Factory = Suite.init(init);
              dynamo$.plug(Kefir.constant({
                Factory: Factory.refs({func}),
                opts
              }));
              suite = _.get(init, 'lastCall.thisValue');
            });

            it('should create an Executable', () => {
              expect(init).to.have.been.calledOnce;
            });

            it('should set the parent to the root Suite', () => {
              expect(suite)
                .to
                .have
                .property('parent', Suite.root);
            });

            it('should plug the executable into the input$ stream', () => {
              expect(ui.delegate.input$.plug)
                .to
                .have
                .been
                .calledWithExactly(Kefir.constant.lastCall.returnValue);
            });

            it('should not execute', () => {
              // the runner should deal w/ this
              expect(func).not.to.have.been.called;
            });

            it('should retain the parent context', () => {
              expect(ui.context)
                .to
                .equal(Suite.root.context);
            });

            describe('when the new Suite begins execution', () => {
              beforeEach(() => {
                suite.emit('suite:execute:begin');
              });

              it("should change the context to the new Suite's", () => {
                expect(ui.context)
                  .to
                  .equal(suite.context);
              });

              describe('and when the Suite ends execution', () => {
                beforeEach(() => {
                  suite.emit('suite:execute:end');
                });

                it('should revert the context to the parent context', () => {
                  expect(ui.context)
                    .to
                    .equal(Suite.root.context);
                });
              });

              describe('and when the new Suite has a child, and it executes',
                () => {
                  let child;

                  beforeEach(() => {
                    const init = sandbox.spy();
                    dynamo$.plug(Kefir.constant({
                      Factory: Suite.init(init),
                      opts
                    }));
                    child = _.get(init, 'lastCall.thisValue');
                    child.emit('suite:execute:begin');
                  });

                  it("should change the context to the child's", () => {
                    expect(ui.context)
                      .to
                      .equal(child.context);
                  });

                  describe('and when the child ends', () => {
                    beforeEach(() => {
                      child.emit('suite:execute:end');
                    });

                    it('should change the context to the parent', () => {
                      expect(ui.context)
                        .to
                        .equal(suite.context);
                    });

                    describe('and when the parent ends', () => {
                      beforeEach(() => {
                        suite.emit('suite:execute:end');
                      });

                      it('should change the context to the root', () => {
                        expect(ui.context)
                          .to
                          .equal(Suite.root.context);
                      });
                    });
                  });
                });
            });
          });

          describe('when plugged with a Test', () => {
            let test;
            let func;

            beforeEach(() => {
              Factory = Test.init(init);
              func = sandbox.spy();
              dynamo$.plug(Kefir.constant({
                Factory: Factory.refs({func}),
                opts
              }));
              test = _.get(init, 'lastCall.thisValue');
            });

            it('should not affect the current Suite', () => {
              expect(ui.context)
                .to
                .equal(Suite.root.context);
            });

            it('should have a parent of the current Suite', () => {
              expect(test.parent)
                .to
                .equal(Suite.root);
            });

            it('should be shuttled off to input$', () => {
              expect(ui.delegate.input$.plug)
                .to
                .be
                .calledWithExactly(Kefir.constant.lastCall.returnValue);
            });

            it('should not execute', () => {
              expect(func).not.to.have.been.called;
            });

            it('should emit "ui:test"', () => {
              expect(() => {
                dynamo$.plug(Kefir.constant({
                  Factory: Factory.refs({func}),
                  opts
                }));
              })
                .to
                .emitFrom(ui, 'ui:test');
            });
          });

          describe('when plugged with a Hook', () => {
            let func;

            beforeEach(() => {
              Factory = Hook.init(init);
              func = sandbox.spy();
            });

            it('should emit "ui:hook"', () => {
              const opts = {
                hooks: 'pre'
              };
              expect(() => {
                dynamo$.plug(Kefir.constant({
                  Factory: Factory.refs({func}),
                  opts
                }));
              })
                .to
                .emitFrom(ui, 'ui:hook');
            });
          });
        });
      });
    });

    describe('method', () => {
      let ui;

      beforeEach(() => {
        ui = UI();
      });

      describe('retries()', () => {
        beforeEach(() => {
          sandbox.stub(ui.context, 'retries');
        });

        it("should call the Context's retries()", () => {
          ui.retries(4);
          expect(ui.context.retries)
            .to
            .have
            .been
            .calledWithExactly(4);
        });

        it('should return the UI', () => {
          expect(ui.retries(2))
            .to
            .equal(ui);
        });
      });

      describe('createTest()', () => {
        let testDef;
        let opts;

        beforeEach(() => {
          testDef = {
            title: 'my test',
            func: _.noop,
            parent: Suite()
          };
          opts = {};
          sandbox.stub(ui, 'createExecutable');
        });

        it('should not throw if no parameters supplied', () => {
          expect(() => ui.createTest())
            .not
            .to
            .throw(Error);
        });

        it('should return the ui', () => {
          expect(ui.createTest(testDef, opts))
            .to
            .equal(ui);
        });

        it('should defer to createExecutable()', () => {
          ui.createTest(testDef, opts);
          expect(ui.createExecutable)
            .to
            .have
            .been
            .calledWithExactly(Test, testDef, opts);
        });
      });

      describe('createSuite()', () => {
        let suiteDef;
        let opts;

        beforeEach(() => {
          suiteDef = {
            title: 'my suite',
            func: _.noop
          };
          opts = {};
          sandbox.stub(ui, 'createExecutable');
        });

        it('should not throw if no parameters supplied', () => {
          expect(() => ui.createSuite())
            .not
            .to
            .throw(Error);
        });

        it('should defer to createExecutable()', () => {
          ui.createSuite(suiteDef, opts);
          expect(ui.createExecutable)
            .to
            .have
            .been
            .calledWithExactly(Suite, suiteDef, opts);
        });

        it('should return the ui', () => {
          expect(ui.createSuite(suiteDef, opts))
            .to
            .equal(ui);
        });
      });

      describe('createExecutable', () => {
        let Factory;
        let opts;
        let definition;

        beforeEach(() => {
          Factory = Suite;
          sandbox.stub(ui, 'write');
          opts = {};
          definition = {};
        });

        it('should throw if passed no Factory', () => {
          expect(ui.createExecutable)
            .to
            .throw(Error);
        });

        it('should not throw if passed a Factory', () => {
          expect(() => ui.createExecutable(Factory))
            .not
            .to
            .throw(Error);
        });

        it('should return the ui', () => {
          expect(ui.createExecutable(Factory))
            .to
            .equal(ui);
        });

        it('should defer to writeExecutable()', () => {
          ui.createExecutable(Factory, definition, opts);
          expect(ui.write)
            .to
            .have
            .been
            .calledWithMatch(ui.dynamo$, sinon.match({
              Factory: sinon.match.func,
              opts
            }));
        });
      });

      describe('write', () => {
        let value;

        beforeEach(() => {
          value = {};
          sandbox.stub(ui.dynamo$, 'plug');
        });

        it('should not throw if not passed parameters', () => {
          expect(() => ui.write())
            .not
            .to
            .throw();
        });

        it('should return the ui', () => {
          expect(ui.write(ui.dynamo$, value))
            .to
            .equal(ui);
        });

        it('should call Kefir.constant() on the value', () => {
          ui.write(ui.dynamo$, value);
          expect(Kefir.constant)
            .to
            .have
            .been
            .calledWithExactly(value);
        });

        it('should plug the resulting Observable into the dynamo$ pool', () => {
          ui.write(ui.dynamo$, value);
          expect(ui.dynamo$.plug)
            .to
            .have
            .been
            .calledWithExactly(Kefir.constant.lastCall.returnValue);
        });

        describe('when curried', () => {
          let write;

          beforeEach(() => {
            write = ui.write(ui.dynamo$);
          });

          it('should call plug() on the pool', () => {
            write(value);
            expect(ui.dynamo$.plug)
              .to
              .have
              .been
              .calledWithExactly(Kefir.constant.lastCall.returnValue);
          });
        });
      });
    });
  });
});
