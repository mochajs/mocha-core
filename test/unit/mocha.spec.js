'use strict';

import Mocha from '../../src/mocha';
import Reporter from '../../src/reporter';
import UI from '../../src/ui';

describe(`mocha`, () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('mocha');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Mocha`, () => {
    describe(`init()`, () => {
      let mocha;

      beforeEach(() => {
        sandbox.stub(Mocha.fixed.methods, 'use');
        mocha = Mocha();
      });

      afterEach(() => {
        mocha.emit('ready');
      });

      it(`should use the default ui`, () => {
        expect(mocha.use)
          .to
          .have
          .been
          .calledWithExactly(mocha.ui);
      });

      it(`should create a "rootSuite"`, () => {
        const mocha = Mocha();
        expect(mocha.rootSuite)
          .to
          .be
          .an('object');
      });
    });

    describe(`method`, () => {
      let mocha;

      beforeEach(() => {
        sandbox.stub(Mocha.fixed.methods, 'use');
        mocha = Mocha();
      });

      afterEach(() => {
        mocha.emit('ready');
      });

      describe(`createAPI()`, () => {
        it(`should return an object`, () => {
          expect(mocha.createAPI())
            .to
            .be
            .an('object');
        });

        it(`should call the "API" param with an object containing a delegate value`,
          () => {
            const stub = sandbox.stub();
            mocha.createAPI(stub);
            expect(stub)
              .to
              .have
              .been
              .calledWithExactly({delegate: mocha});
          });

        it(`should not override any delegate option`, () => {
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

      describe(`createReporter()`, () => {
        beforeEach(() => {
          sandbox.stub(mocha, 'createAPI');
        });

        it(`should defer to createAPI using "Reporter" API`, () => {
          mocha.createReporter();
          expect(mocha.createAPI)
            .to
            .have
            .been
            .calledWithExactly(Reporter, {});
        });
      });

      describe(`createUI()`, () => {
        beforeEach(() => {
          sandbox.stub(mocha, 'createAPI');
        });

        it(`should defer to createAPI using "UI" API`, () => {
          mocha.createUI();
          expect(mocha.createAPI)
            .to
            .have
            .been
            .calledWith(UI);
        });

        it(`should call createAPI w/ a "rootSuite" object`, () => {
          mocha.createUI();
          expect(mocha.createAPI)
            .to
            .have
            .been
            .calledWithExactly(UI, {rootSuite: mocha.rootSuite});
        });
      });
    });
  });
});
