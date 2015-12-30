'use strict';
const _ = require('lodash');
const Suite = require('../../../src/ui/suite');

describe(`ui`, () => {
  const UI = require('../../../src/ui');
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('ui');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`UI()`, () => {
    describe(`if given a rootSuite property`, () => {
      it(`should call setSuiteContext()`, () => {
        const rootSuite = Suite();
        const ui = UI.methods({
          setSuiteContext: sandbox.stub()
        })({rootSuite});
        expect(ui.setSuiteContext)
          .to
          .have
          .been
          .calledWithExactly(rootSuite);
      });
    });

    describe(`if not given a rootSuite property`, () => {
      it(`should call setSuiteContext()`, () => {
        const ui = UI.methods({
          setSuiteContext: sandbox.spy(UI.fixed.methods.setSuiteContext)
        })();
        expect(ui.setSuiteContext)
          .to
          .have
          .been
          .calledWithExactly(ui.Suite.fixed.refs.parent);
      });
    });

    describe(`method`, () => {
      let ui;

      beforeEach(() => {
        ui = UI();
        sandbox.stub(ui, 'emit');
      });

      describe(`setSuiteContext()`, () => {
        it(`should set the Suite prop to be a factory having ref parent`,
          () => {
            const parent = Suite();
            ui.setSuiteContext(parent);
            expect(ui.Suite.fixed.refs.parent)
              .to
              .equal(parent);
          });
      });

      describe(`createSuite()`, () => {
        let suiteDef;
        let suite;

        beforeEach(() => {
          suiteDef = {
            title: 'my suite',
            func: _.noop
          };
          ui.Suite = ui.Suite.methods({
            execute: sandbox.stub()
          });
          sandbox.spy(ui, 'Suite');
          suite = ui.createSuite(suiteDef);
        });

        it(`should return a Suite`, () => {
          expect(ui.createSuite(suiteDef))
            .to
            .be
            .an('object');
        });

        it(`should instantiate a Suite`, () => {
          expect(ui.Suite)
            .to
            .have
            .been
            .calledWithExactly(suiteDef);
        });

        it(`should emit 'will-execute-suite'`, () => {
          expect(ui.emit)
            .to
            .have
            .been
            .calledWithExactly('will-execute-suite', suite);
        });

        it(`should call suite.execute()`, () => {
          expect(suite.execute)
            .to
            .have
            .been
            .calledOn(suite);
        });

        it(`should emit 'did-execute-suite'`, () => {
          expect(ui.emit)
            .to
            .have
            .been
            .calledWithExactly('did-execute-suite', suite);
        });
      });
    });
  });
});
