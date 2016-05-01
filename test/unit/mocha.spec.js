import Mocha from '../../src/mocha';
import {Reporter} from '../../src/reporter';
import {UI} from '../../src/ui';

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
        sandbox.stub(Mocha.fixed.methods, 'use').returnsThis();
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
        sandbox.stub(Mocha.fixed.methods, 'use').returnsThis();
        mocha = Mocha();
      });

      afterEach(() => {
        mocha.emit('ready');
      });

      describe('createAPI()', () => {
        it('should return an object', () => {
          expect(mocha.createAPI())
            .to
            .be
            .an('object');
        });

        it(
          'should call the "API" param with an object containing a delegate value',
          () => {
            const stub = sandbox.stub();
            mocha.createAPI(stub);
            expect(stub)
              .to
              .have
              .been
              .calledWithExactly({delegate: mocha});
          });

        it('should not override any delegate option', () => {
          const stub = sandbox.stub();
          const delegate = {};
          mocha.createAPI(stub, {delegate});
          expect(stub)
            .to
            .have
            .been
            .calledWithExactly({delegate});
        });
      });

      describe('createReporter()', () => {
        let props;
        beforeEach(() => {
          props = {};
          sandbox.stub(mocha, 'createAPI');
        });

        it('should defer to createAPI using "Reporter" API', () => {
          mocha.createReporter(props);
          expect(mocha.createAPI)
            .to
            .have
            .been
            .calledWithExactly(Reporter, props);
        });
      });

      describe('createUI()', () => {
        let props;

        beforeEach(() => {
          props = {};
          sandbox.stub(mocha, 'createAPI');
        });

        it('should defer to createAPI using "UI" API', () => {
          mocha.createUI(props);
          expect(mocha.createAPI)
            .to
            .have
            .been
            .calledWithExactly(UI, props);
        });
      });
    });
  });
});
