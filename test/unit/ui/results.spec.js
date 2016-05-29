import {Result} from '../../../src/ui/helpers/results';

describe('ui/result', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('ui/result');
  });

  describe('Result()', () => {
    it('should return an object', () => {
      expect(Result())
        .to
        .be
        .an('object');
    });

    describe('method', () => {
      let result;

      beforeEach(() => {
        result = Result({fulfilled: 'sync'});
      });

      describe('finish()', () => {
        beforeEach(() => {
          sandbox.stub(result, 'finalize')
            .returns(result);
        });

        describe('when an error is supplied', () => {
          let err;

          beforeEach(() => {
            err = new Error();
          });

          it('should set "failed" to true', () => {
            expect(result.complete(err))
              .to
              .have
              .property('failed', true);
          });

          it('should set "reason" to the error', () => {
            expect(result.complete(err))
              .to
              .have
              .property('reason', err);
          });
        });

        describe('when no error is passed', () => {
          it('should set "failed" to false', () => {
            expect(result.complete())
              .to
              .have
              .property('failed', false);
          });

          it('should set "error" to undefined', () => {
            expect(result.complete())
              .not
              .to
              .have
              .property('error');
          });
        });

        it('should call Result#finalize()', () => {
          result.complete();
          expect(result.finalize).to.have.been.calledOnce;
        });
      });

      describe('abort()', () => {
        beforeEach(() => {
          sandbox.stub(result, 'finalize')
            .returns(result);
        });

        it('should set an "error" property', () => {
          expect(result.abort())
            .to
            .have
            .property('error');
        });

        describe('when an error is supplied', () => {
          let err;

          beforeEach(() => {
            err = new Error();
          });

          it('should set "error" to the error', () => {
            expect(result.abort(err))
              .to
              .have
              .property('error', err);
          });
        });

        it('should call Result#finalize()', () => {
          result.complete();
          expect(result.finalize).to.have.been.calledOnce;
        });
      });

      describe('finalize()', () => {
        it('should freeze the result', () => {
          expect(Result()
            .finalize()).to.be.frozen;
        });

        it('should return the Result', () => {
          const result = Result();
          expect(result.finalize())
            .to
            .equal(result);
        });
      });

      describe('toString()', () => {
        it('should return a JSON representation', () => {
          expect(String(Result({a: 'b'})))
            .to
            .equal(JSON.stringify({a: 'b'}));
        });
      });
    });

    describe('property', () => {
      describe('async', () => {
        [
          'skipped',
          'error',
          'sync'
        ].forEach(fulfilled => {
          describe(`when "fulfilled" is "${fulfilled}"`, () => {
            it('should be false', () => {
              expect(Result({fulfilled}))
                .to
                .have
                .property('async', false);
            });
          });
        });

        [
          'userCallback',
          'promise',
          'async'
        ].forEach(fulfilled => {
          describe(`when "fulfilled" is "${fulfilled}"`, () => {
            it('should be true', () => {
              expect(Result({fulfilled}))
                .to
                .have
                .property('async', true);
            });
          });
        });
      });

      describe('passed', () => {
        describe('when "aborted" is true', () => {
          it('should be false', () => {
            expect(Result({aborted: true}))
              .to
              .have
              .property('passed', false);
          });
        });

        describe('when "failed" is true', () => {
          it('should be false', () => {
            expect(Result({failed: true}))
              .to
              .have
              .property('passed', false);
          });
        });

        describe('when "aborted" is false', () => {
          it('should be true', () => {
            expect(Result({aborted: false}))
              .to
              .have
              .property('passed', true);
          });
        });

        describe('when "failed" is false', () => {
          it('should be true', () => {
            expect(Result({aborted: false}))
              .to
              .have
              .property('passed', true);
          });
        });
      });
    });
  });

  afterEach(() => {
    sandbox.restore();
  });
});
