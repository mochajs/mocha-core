'use strict';

import {Test, Suite} from '../../../src/ui';
import noop from 'lodash/noop';

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
          .throw(Error, /suite/i);
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

              it(`should be pending`, () => {
                expect(test.pending).to.be.true;
              });

              describe(`and is subsequently supplied a falsy value`, () => {
                beforeEach(() => {
                  test.pending = false;
                });

                it(`should not be pending`, () => {
                  expect(test.pending).to.be.false;
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
              it(`should have no effect`, () => {
                expect(() => test.pending = false).not.to.change(test, 'pending');
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
            return expect(test.run()).to.eventually.be.fulfilled;
          });

          it(`should return a "skipped" result`, () => {
            return expect(test.run())
              .to
              .eventually
              .contain
              .all
              .keys({
                fulfilled: 'skipped',
                aborted: true,
                completed: false,
                skipped: true
              })
              .and
              .have
              .property('elapsed')
              .at
              .least(0);
          });

          describe(`if no longer pending`, () => {
            beforeEach(() => {
              return test.run()
                .then(() => test.func = noop);
            });

            it(`should be allowed to run`, () => {
              return expect(test.run()).to.eventually.be.fulfilled;
            });
          });
        });

        describe(`when the test is not pending`, () => {
          describe(`and the test is synchronous`, () => {
            beforeEach(() => {
              test.func = sandbox.spy();
            });

            describe(`and the function does not throw an error`, () => {
              let result;

              beforeEach(() => {
                return test.run()
                  .then(res => {
                    result = res
                  });
              });

              it(`should run the function`, () => {
                expect(test.func).to.have.been.calledOnce;
              });

              it(`should end in state "passed"`, () => {
                expect(test.current)
                  .to
                  .equal('passed');
              });

              it(`should return an "passed" result`, () => {
                expect(result.passed).to.be.true;
              });

              describe(`when rerun`, () => {
                it(`should reject`, () => {
                  return expect(test.run())
                    .to
                    .eventually
                    .be
                    .rejectedWith(Error);
                });
              });
            });
          });

          describe(`and the test is asynchronous`, () => {
            describe(`and when the function does not throw an error`, () => {
              let funcUnderTest;

              beforeEach(() => {
                funcUnderTest = sandbox.stub();
                test.func = testDone => {
                  setTimeout(() => {
                    funcUnderTest();
                    testDone();
                  }, 50);
                };

                return test.run().then(res => console.log(res));
              });

              it(`should run the function`, () => {
                expect(funcUnderTest).to.have.been.calledOnce;
              });

              it(`should end in state "passed"`, () => {
                expect(test.current)
                  .to
                  .equal('passed');
              });

              it(`should reject if rerun`, () => {
                return expect(test.run())
                  .to
                  .eventually
                  .be
                  .rejectedWith(Error);
              });
            });

            describe(`and when the function throws an error`, () => {
              beforeEach(() => {
                test.func = () => {
                  setTimeout(function bzzt () {
                    throw new Error('foo');
                  }, 50);
                };

                return test.run();
              });

              it(`should end in state "failed"`, () => {
                expect(test.current)
                  .to
                  .equal('failed');
              });

              it(`should allow the test to be rerun`, () => {
                expect(test.run()).to.eventually.be.resolved;
              });
            });
          });
        });
      });
    });
  });
});
