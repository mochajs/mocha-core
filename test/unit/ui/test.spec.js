import {Test, Suite} from '../../../src/ui';
import {noop} from 'lodash';

describe('ui/test', () => {
  let sandbox;

  beforeEach(() => sandbox = sinon.sandbox.create('ui/test'));

  afterEach(() => sandbox.restore());

  describe('Test()', () => {
    let suite;
    let parent;
    beforeEach(() => {
      parent = Suite();
      suite = Suite({
        parent,
        func: noop
      });
    });

    describe('method', () => {
      let test;

      beforeEach(() => {
        test = Test({
          suite,
          title: 'my test'
        });
      });

      describe('run()', () => {
        describe('when the test is pending', () => {
          it('should end in state "skipped"', () => {
            return expect(test.run()).to.eventually.be.fulfilled
              .then(() => {
                expect(test.current).to.equal('skipped');
              });
          });
        });

        describe('when the test is not pending', () => {
          describe('and the test is synchronous', () => {
            beforeEach(() => {
              test.func = sandbox.spy();
            });

            describe('and the function does not throw an error', () => {
              beforeEach(() => {
                return test.run();
              });

              it('should end in state "passed"', () => {
                expect(test.current)
                  .to
                  .equal('passed');
              });

              describe('when rerun', () => {
                it('should reject', () => {
                  return expect(test.run())
                    .to
                    .eventually
                    .be
                    .rejectedWith(Error);
                });
              });
            });
          });

          describe('and the test is asynchronous', () => {
            describe('and when the function does not throw an error', () => {
              let funcUnderTest;

              beforeEach(() => {
                funcUnderTest = sandbox.stub();
                test.func = testDone => {
                  setTimeout(() => {
                    funcUnderTest();
                    testDone();
                  }, 50);
                };

                return test.run();
              });

              it('should end in state "passed"', () => {
                expect(test.current)
                  .to
                  .equal('passed');
              });

              describe('when rerun', () => {
                it('should reject', () => {
                  return expect(test.run())
                    .to
                    .eventually
                    .be
                    .rejectedWith(Error);
                });
              });
            });

            describe('and when the function throws an error', function () {
              beforeEach(() => {
                test.func = () => {
                  setTimeout(function bzzt () {
                    throw new Error('foo');
                  }, 50);
                };

                return test.run();
              });

              it('should end in state "failed"', () => {
                expect(test.current)
                  .to
                  .equal('failed');
              });

              it('should allow the test to be rerun', () => {
                expect(test.run()).to.eventually.be.resolved;
              });
            });
          });

          describe('and the test returns a Promise', () => {
            describe('and when the function does not throw an error', () => {
              let func;

              beforeEach(() => {
                func = sandbox.stub();
                test.func = () => {
                  return new Promise(resolve => {
                    func();
                    resolve();
                  });
                };

                return test.run();
              });

              it('should end in state "passed"', () => {
                expect(test.current)
                  .to
                  .equal('passed');
              });

              describe('when rerun', () => {
                it('should reject', () => {
                  return expect(test.run())
                    .to
                    .eventually
                    .be
                    .rejectedWith(Error);
                });
              });
            });

            describe('and when the function throws an error', function () {
              beforeEach(() => {
                test.func = () => {
                  return new Promise(() => {
                    throw new Error('foo');
                  });
                };

                return test.run();
              });

              it('should end in state "failed"', () => {
                expect(test.current)
                  .to
                  .equal('failed');
              });
            });

            describe('and when the function rejects', function () {
              beforeEach(() => {
                test.func = () => {
                  return new Promise((resolve, reject) => {
                    reject(new Error('foo'));
                  });
                };

                return test.run();
              });

              it('should end in state "failed"', () => {
                expect(test.current)
                  .to
                  .equal('failed');
              });
            });
          });
        });
      });
    });
  });
});
