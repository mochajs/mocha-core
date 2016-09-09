import Mocha from '../../src/mocha';
import {UI} from '../../src/ui';
import {Runner} from '../../src/runner';

describe('mocha', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('mocha');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Mocha', () => {
    describe('init()', () => {
      let mocha;

      beforeEach(() => {
        sandbox.stub(Mocha.fixed.methods, 'use')
          .returnsThis();
        mocha = Mocha({
          ui: 'foo',
          runner: 'bar'
        });
      });

      it('should call "use" with the value of "ui"', () => {
        expect(mocha.use)
          .to
          .have
          .been
          .calledWithExactly('foo');
      });

      it('should call "use" with the value of "runner"', () => {
        expect(mocha.use)
          .to
          .have
          .been
          .calledWithExactly('bar');
      });
    });

    describe('method', () => {
      let mocha;

      beforeEach(() => {
        sandbox.stub(Mocha.fixed.methods, 'use')
          .returnsThis();
        mocha = Mocha();
      });

      afterEach(() => {
        mocha.emit('ready');
      });

      describe('createReporter()', () => {
        let props;
        beforeEach(() => {
          props = {};
          sandbox.stub(mocha, 'createAPI');
        });

        it('should defer to createAPI', () => {
          mocha.createReporter(props);
          expect(mocha.createAPI).to.have.been.calledOnce;
        });
      });

      describe('createUI()', () => {
        let props;
        let ui;

        beforeEach(() => {
          props = {};
          sandbox.stub(mocha, 'createAPI')
            .returns(UI.refs({
              delegate: mocha,
              runnable$: mocha.runnable$
            })());
          ui = mocha.createUI(props);
        });

        it('should return a UI instance', () => {
          expect(ui)
            .to
            .be
            .an('object');
        });

        it('should defer to createAPI', () => {
          expect(mocha.createAPI).to.have.been.calledOnce;
        });
      });

      describe('createRunner()', () => {
        let props;
        let runner;

        beforeEach(() => {
          props = {};
          sandbox.stub(mocha, 'createAPI')
            .returns(Runner.refs({
              delegate: mocha,
              runnable$: mocha.runnable$,
              running$: mocha.running$
            })());
          runner = mocha.createRunner(props);
        });

        it('should return a Runner instance', () => {
          expect(runner)
            .to
            .be
            .an('object');
        });

        it('should defer to createAPI', () => {
          expect(mocha.createAPI).to.have.been.calledOnce;
        });
      });

      describe('createAPI()', () => {
        let Factory;

        beforeEach(() => {
          Factory = sandbox.stub()
            .returns({});
        });

        it('should throw if no Factory passed', () => {
          expect(() => mocha.createAPI())
            .to
            .throw(Error);
        });

        it('should return an object', () => {
          expect(mocha.createAPI(Factory))
            .to
            .be
            .an('object');
        });

        it('should call Factory with a delegate', () => {
          mocha.createAPI(Factory);
          expect(Factory)
            .to
            .have
            .been
            .calledWithExactly({
              delegate: mocha
            });
        });
      });
    });
  });
});
