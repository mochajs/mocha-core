import {Executable, Suite} from '../../../src/ui';
import {noop, forEach} from 'lodash';
import {setImmediate} from '../../../src/util';

describe('ui/executable', () => {
  let sandbox;

  beforeEach(() => sandbox = sinon.sandbox.create('ui/executable'));

  afterEach(() => sandbox.restore());

  describe('Executable()', () => {
    let suite;
    let parent;
    beforeEach(() => {
      parent = Suite();
      suite = Suite({
        parent,
        func: noop
      });
    });

    describe('when instantiated with a "suite" prop', () => {
      it('should not throw', () => {
        expect(() => Executable({parent: suite}))
          .not
          .to
          .throw();
      });

      it('should return an object', () => {
        expect(Executable({parent: suite}))
          .to
          .be
          .an('object');
      });
    });

    describe('property', () => {
      describe('pending', () => {
        describe('getter', () => {
          describe('when the executable has no function', () => {
            let test;

            beforeEach(() => {
              test = Executable({parent: suite});
            });

            it('should be true', () => {
              expect(test.pending).to.be.true;
            });
          });

          describe('when the Suite is pending', () => {
            let test;

            beforeEach(() => {
              suite.pending = true;
              test = Executable({
                parent: suite,
                func: noop
              });
            });

            it('should be true', () => {
              expect(test.pending).to.be.true;
            });
          });

          describe('when the executable has a function', () => {
            let test;

            beforeEach(() => {
              test = Executable({
                parent: suite,
                func: noop
              });
            });

            describe('and the Suite is not pending', () => {
              it('should be false', () => {
                expect(test.pending).to.be.false;
              });
            });
          });
        });

        describe('setter', () => {
          describe('when the Executable has an initial function', () => {
            let test;

            beforeEach(() => {
              test = Executable({
                parent: suite,
                func: noop
              });
            });

            describe('and it is supplied a truthy value', () => {
              beforeEach(() => {
                test.pending = true;
              });

              it('should be pending', () => {
                expect(test.pending).to.be.true;
              });

              describe('and is subsequently supplied a falsy value', () => {
                beforeEach(() => {
                  test.pending = false;
                });

                it('should not be pending', () => {
                  expect(test.pending).to.be.false;
                });
              });
            });
          });

          describe('when the Executable has no initial function', () => {
            let test;

            beforeEach(() => {
              test = Executable({parent: suite});
            });

            describe('and it is supplied a falsy value', () => {
              it('should have no effect', () => {
                expect(() => test.pending = false)
                  .not
                  .to
                  .change(test, 'pending');
              });
            });
          });
        });
      });
    });

    describe('method', () => {
      let executable;
      let testCount = 0;

      beforeEach(() => {
        executable = Executable({
          parent: suite,
          title: `test#${testCount}`,
          func: noop
        });
      });

      afterEach(() => {
        testCount++;
      });

      describe('execute()', () => {
        describe('when the executable is pending', () => {
          beforeEach(() => {
            executable.pending = true;
          });

          it('should return a "skipped" result', () => {
            return expect(executable.execute())
              .to
              .eventually
              .have
              .deep
              .property('result.fulfilled', 'skipped');
          });

          describe('if no longer pending', () => {
            beforeEach(() => {
              return executable.execute()
                .then(() => executable.func = noop);
            });

            it('should be allowed to run', () => {
              return expect(executable.execute()).to.eventually.be.fulfilled;
            });
          });
        });

        describe('when the executable is not pending', () => {
          describe('and the executable is synchronous', () => {
            beforeEach(() => {
              executable.func = sandbox.spy();
            });

            describe('and the function does not throw an error', () => {
              let result;

              beforeEach(() => {
                return executable.execute()
                  .then(opts => result = opts.result);
              });

              it('should run the function', () => {
                expect(executable.func).to.have.been.calledOnce;
              });

              it('should return a "passed" result', () => {
                expect(result.passed).to.be.true;
              });
            });
          });

          forEach({
            setTimeout: setTimeout,
            setImmediate: setImmediate,
            'process.nextTick': process.nextTick
          }, (timer, timerName) => {
            describe(`and the executable uses ${timerName}`, () => {
              const delays = timerName === 'setTimeout' ? [
                0,
                50,
                200,
                500
              ] : [0];

              delays.forEach(delay => {
                describe(`with delay ${delay}`, () => {
                  describe('and when the function does not throw an error', () => {
                    let func;
                    let result;

                    beforeEach(() => {
                      func = sandbox.stub();

                      executable.func = testDone => {
                        timer(() => {
                          func();
                          testDone();
                        }, delay);
                      };

                      return executable.execute()
                        .then(opts => result = opts.result);
                    });

                    it('should return a "passed" result', () => {
                      expect(result.passed).to.be.true;
                    });

                    it('should run the function', () => {
                      expect(func).to.have.been.calledOnce;
                    });
                  });
                });
              });
            });
          });

          describe('and the executable returns a Promise', () => {
            describe('and when the function does not throw an error', () => {
              let func;
              let result;

              beforeEach(() => {
                func = sandbox.stub();

                executable.func = () => new Promise(resolve => {
                  func();
                  resolve();
                });

                return executable.execute()
                  .then(opts => result = opts.result);
              });

              it('should run the function', () => {
                expect(func).to.have.been.calledOnce;
              });

              it('should not error', () => {
                expect(result.error).to.be.undefined;
              });

              it('should return a "passed" result', () => {
                expect(result.passed).to.be.true;
              });
            });

            describe('and when the function throws an error', function () {
              beforeEach(() => {
                executable.func = () => {
                  return new Promise(() => {
                    throw new Error('foo');
                  });
                };

                return executable.execute();
              });

              it('should allow the executable to be rerun', () => {
                return expect(executable.execute()).to.eventually.be.resolved;
              });
            });

            describe('and when the function rejects', function () {
              beforeEach(() => {
                executable.func = () => {
                  return new Promise((resolve, reject) => {
                    reject(new Error('foo'));
                  });
                };

                return executable.execute();
              });

              it('should allow the executable to be rerun', () => {
                return expect(executable.execute()).to.eventually.be.resolved;
              });
            });
          });
        });
      });
    });
  });
});
