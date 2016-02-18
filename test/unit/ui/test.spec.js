'use strict';

import {Test, Suite} from '../../../src/ui';
import noop from 'lodash/noop';
import '../../../src/util/execution-context';

describe(`ui/test`, () => {
  let sandbox;

  beforeEach(() => sandbox = sinon.sandbox.create('ui/test'));

  afterEach(() => sandbox.restore());

  describe(`Test()`, () => {
    let suite;
    let parent;
    beforeEach(() => {
      parent = Suite();
      suite = Suite({
        parent,
        func: noop
      });
    });

    describe(`when not instantiated w/ a "suite" prop`, () => {
      it(`should throw`, () => {
        expect(Test)
          .to
          .throw(Error, /suite/);
      });
    });

    describe(`when instantiated with a "suite" prop`, () => {
      it(`should not throw`, () => {
        expect(() => Test({suite}))
          .not
          .to
          .throw();
      });

      it(`should return an object`, () => {
        expect(Test({suite}))
          .to
          .be
          .an('object');
      });
    });

    describe(`property`, () => {
      describe(`pending`, () => {
        describe(`getter`, () => {
          describe(`when the test has no function`, () => {
            let test;

            beforeEach(() => {
              test = Test({suite});
            });

            it(`should be true`, () => {
              expect(test.pending).to.be.true;
            });
          });

          describe(`when the Suite is pending`, () => {
            let test;

            beforeEach(() => {
              suite.pending = true;
              test = Test({
                suite,
                func: noop
              });
            });

            it(`should be true`, () => {
              expect(test.pending).to.be.true;
            });
          });

          describe(`when the test has a function`, () => {
            let test;

            beforeEach(() => {
              test = Test({
                suite,
                func: noop
              });
            });

            describe(`and the Suite is not pending`, () => {
              it(`should be false`, () => {
                expect(test.pending).to.be.false;
              });
            });
          });
        });

        describe(`setter`, () => {
          describe(`when the Test has an initial function`, () => {
            let test;

            beforeEach(() => {
              test = Test({
                suite,
                func: noop
              });
            });

            describe(`and it is supplied a truthy value`, () => {
              beforeEach(() => {
                test.pending = true;
              });

              it(`should set the "func" property to null`, () => {
                expect(test.func).to.be.null;
              });

              describe(`and is subsequently supplied a falsy value`, () => {
                beforeEach(() => {
                  test.pending = false;
                });

                it(`should reset the function`, () => {
                  expect(test.func)
                    .to
                    .equal(noop);
                });
              });
            });
          });

          describe(`when the Test has no initial function`, () => {
            let test;

            beforeEach(() => {
              test = Test({suite});
            });

            describe(`and it is supplied a falsy value`, () => {
              beforeEach(() => {
                test.pending = false;
              });

              it(`should have no effect`, () => {
                expect(test.pending).to.be.true;
              });
            });
          });
        });
      });
    });

    describe(`method`, () => {
      let test;

      beforeEach(() => {
        test = Test({
          suite,
          title: 'my test'
        });
      });

      describe(`run()`, () => {
        describe(`when the test is pending`, () => {
          it(`should end in state "skipped"`, () => {
            test.run();
            expect(test.state)
              .to
              .equal('skipped');
          });

          describe(`if no longer pending`, () => {
            beforeEach(() => {
              test.run();
              test.func = noop;
            });

            it(`should be allowed to run`, done => {
              test.once('passed', done);
              expect(() => test.run())
                .not
                .to
                .throw();
            });
          });
        });

        describe(`when the test is not pending`, () => {
          xdescribe(`and the test is synchronous`, () => {
            beforeEach(() => {
              test.func = sandbox.spy();
            });

            describe(`and when the function does not throw an error`, () => {
              beforeEach(() => {
                test.run();
              });

              it(`should run the function`, () => {
                expect(test.func).to.have.been.calledOnce;
              });

              it(`should end in state "passed"`, () => {
                expect(test.state)
                  .to
                  .equal('passed');
              });

              it(`should throw if rerun`, () => {
                expect(() => test.run())
                  .to
                  .throw(Error, /invalid/i);
              });
            });
          });

          describe(`and the test is asynchronous`, () => {
            beforeEach(() => {
              sandbox.spy(test, 'pass');
            });

            describe(`and when the function does not throw an error`, () => {
              let funcUnderTest;

              beforeEach(() => {
                funcUnderTest = sandbox.stub();
                test.func = testDone => {
                  setTimeout(() => {
                    funcUnderTest();
                    testDone();
                  }, 200);
                };

                return test.run();
              });

              it(`should run the function`, () => {
                expect(funcUnderTest).to.have.been.calledOnce;
              });

              it(`should end in state "passed"`, () => {
                expect(test.state)
                  .to
                  .equal('passed');
              });

              it(`should throw if rerun`, () => {
                return expect(test.run())
                  .to
                  .eventually
                  .be
                  .rejectedWith(Error, /invalid/i);
              });
            });

            describe(`and when the function throws an error`, () => {
              beforeEach(() => {
                test.func = () => {
                  setTimeout(function bzzt () {
                    throw new Error('foo');
                  }, 200);
                };

                return test.run()
                  .catch(err => {
                    expect(err.message)
                      .to
                      .equal('foo');
                  });
              });

              it(`should end in state "failed"`, () => {
                expect(test.state)
                  .to
                  .equal('failed');
              });

              it(`should allow the test to be rerun`, () => {
                let finished;
                expect(() => {
                  finished = test.run();
                })
                  .not
                  .to
                  .throw();
                return finished.catch(noop);
              });
            });
          });
        });
      });
    });
  });
});
