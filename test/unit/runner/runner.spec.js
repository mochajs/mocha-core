import {Runner as _Runner} from '../../../src/runner';
import {Kefir} from 'kefir';

describe('runner/runner', () => {
  let sandbox;
  let delegate;
  let Runner;
  let suites;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('runner/runner');
    suites = Kefir.pool();
    delegate = {suites};
    Runner = _Runner.refs({delegate, suites});
  });

  describe('Runner()', () => {
    it('should return an Object', () => {
      expect(Runner())
        .to
        .be
        .an('object');
    });

    describe('queue', () => {
      let runner;

      beforeEach(() => {
        runner = Runner();
      });

      describe('when a Suite enters the queue', () => {
        let suite;

        beforeEach(() => {
          suite = {};
        });

        it('should emit "suite:run"', () => {
          expect(() => suites.plug(Kefir.constant({suite})))
            .to
            .emitFrom(runner, 'suite:run', suite);
        });

        describe('and the Suite is excluded', () => {
          it('should emit "suite:exclude"', () => {
            expect(() => suites.plug(Kefir.constant({
              suite,
              opts: {exclude: true}
            })))
              .to
              .emitFrom(runner, 'suite:exclude', suite);
          });

          it('should not emit "suite:run"', () => {
            expect(() => suites.plug(Kefir.constant({
              suite,
              opts: {exclude: true}
            })))
              .not
              .to
              .emitFrom(runner, 'suite:run', suite);
          });

          // describe('when an inclusive filter is applied', () => {
          //   beforeEach(() => {
          //     sandbox.stub(runner, 'emit');
          //   });
          //
          //   it('should still emit "suite:exclude" ', () => {
          //     const stream = Kefir.sequentially(0, [
          //       {
          //         suite,
          //         opts: {exclude: true}
          //       },
          //       {
          //         suite,
          //         opts: {exclude: true}
          //       },
          //       {
          //         suite,
          //         opts: {include: true}
          //       },
          //       {
          //         suite,
          //         opts: {exclude: true}
          //       }
          //     ]);
          //     queue.plug(stream);
          //     return stream.toPromise()
          //       .then(() => {
          //         expect(runner.emit.getCalls()
          //           .map(call => call.args[0]))
          //           .to
          //           .eql([
          //             'suite:exclude',
          //             'suite:exclude',
          //             'suite:run',
          //             'suite:exclude'
          //           ]);
          //       });
          //   });
          // });
        });

      });

    });
  });

  afterEach(() => {
    sandbox.restore();
  });
});
