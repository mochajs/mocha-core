import {Runner} from '../../../src/runner';
import {Streamable, EventEmittable} from '../../../src/core';
import Suite from '../../../src/ui/suite';
import Test from '../../../src/ui/test';
import Hook from '../../../src/ui/hook';
import {Kefir} from 'kefir';
import {toPairs, forEach} from 'lodash/fp';

describe('runner/runner', () => {
  let sandbox;
  let delegate;
  let executable$;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('runner/runner');
    executable$ = Kefir.pool();
    delegate = Streamable.compose(EventEmittable)({executable$});
  });

  describe('Runner()', () => {
    it('should return an Object', () => {
      expect(Runner({delegate}))
        .to
        .be
        .an('object');
    });

    describe('Observable', () => {
      let runner;

      beforeEach(() => {
        runner = Runner({delegate});
      });

      describe('base events', () => {
        forEach(([name, Factory]) => {
          const lowerName = name.toLowerCase();

          describe(`when a ${name} enters the Observable`, () => {
            let executable;

            beforeEach(() => {
              executable = Factory();
            });

            it(`should emit "runner:${lowerName}"`, () => {
              expect(() => executable$.plug(Kefir.constant({executable})))
                .to
                .emitFrom(runner, `runner:${lowerName}`, executable);
            });

            describe('and the ${name} is neither inclusive nor exclusive',
              () => {
                it(`should emit "runner:${lowerName}:runnable"`, () => {
                  expect(() => executable$.plug(Kefir.constant({executable})))
                    .to
                    .emitFrom(runner,
                      `runner:${lowerName}:runnable`,
                      executable);
                });
              });

            describe(`and the ${name} enters again (a duplicate)`, () => {
              beforeEach(() => {
                executable$.plug(Kefir.constant({executable}));
              });

              it('should not emit anything', () => {
                expect(() => executable$.plug(Kefir.constant({executable})))
                  .not
                  .to
                  .emitFrom(runner);
              });
            });

            describe(`and the ${name} is excluded`, () => {
              it(`should emit "runner:${lowerName}:exclude"`, () => {
                expect(() => executable$.plug(Kefir.constant({
                  executable,
                  opts: {exclude: true}
                })))
                  .to
                  .emitFrom(runner, `runner:${lowerName}:exclude`, executable);
              });

              it(`should not emit "runner:${lowerName}:runnable"`, () => {
                expect(() => executable$.plug(Kefir.constant({
                  executable,
                  opts: {exclude: true}
                })))
                  .not
                  .to
                  .emitFrom(runner, `runner:${lowerName}:runnable`, executable);
              });
            });

            describe(`and the ${name} is inclusive`, () => {
              it(`should emit "runner:${lowerName}:include`, () => {
                expect(() => executable$.plug(Kefir.constant({
                  executable,
                  opts: {include: true}
                })))
                  .to
                  .emitFrom(runner, `runner:${lowerName}:include`, executable);
              });

              it(`should emit "runner:${lowerName}:runnable"`, () => {
                expect(() => executable$.plug(Kefir.constant({
                  executable,
                  opts: {include: true}
                })))
                  .to
                  .emitFrom(runner, `runner:${lowerName}:runnable`, executable);
              });

              describe(`and a non-inclusive ${name} then enters the Observable`,
                () => {
                  let nextExecutable;

                  beforeEach(() => {
                    executable$.plug(Kefir.constant({
                      executable,
                      opts: {include: true}
                    }));
                    nextExecutable = Factory();
                  });

                  it(`should emit "runner:${lowerName}"`, () => {
                    expect(() => executable$.plug(Kefir.constant({executable: nextExecutable})))
                      .to
                      .emitFrom(runner, `runner:${lowerName}`, nextExecutable);
                  });

                  it(`should not emit "runner:${lowerName}:runnable"`, () => {
                    expect(() => executable$.plug(Kefir.constant({executable})))
                      .not
                      .to
                      .emitFrom(runner,
                        `runner:${lowerName}:runnable`,
                        executable);
                  });
                });

              describe(`and another inclusive ${name} then enters the Observable`,
                () => {
                  let opts;
                  let nextExecutable;

                  beforeEach(() => {
                    opts = {include: true};
                    executable$.plug(Kefir.constant({
                      executable,
                      opts
                    }));
                    nextExecutable = Factory();
                  });

                  it(`should emit "runner:${lowerName}"`, () => {
                    expect(() => executable$.plug(Kefir.constant({
                      executable: nextExecutable,
                      opts
                    })))
                      .to
                      .emitFrom(runner, `runner:${lowerName}`, nextExecutable);
                  });

                  it(`should emit "runner:${lowerName}:include"`, () => {
                    expect(() => executable$.plug(Kefir.constant({
                      executable: nextExecutable,
                      opts
                    })))
                      .to
                      .emitFrom(runner,
                        `runner:${lowerName}:include`,
                        nextExecutable);
                  });

                  it(`should emit "runner:${lowerName}:runnable"`, () => {
                    expect(() => executable$.plug(Kefir.constant({
                      executable: nextExecutable,
                      opts
                    })))
                      .to
                      .emitFrom(runner,
                        `runner:${lowerName}:runnable`,
                        nextExecutable);
                  });
                });
            });
          });
        }, [
          [
            'Suite',
            Suite
          ],
          [
            'Test',
            Test
          ],
          [
            'Hook',
            Hook
          ]
        ]);
      });
    });
  });

  afterEach(() => {
    sandbox.restore();
  });
});
