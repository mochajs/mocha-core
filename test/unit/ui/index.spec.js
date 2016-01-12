'use strict';

import _ from 'lodash';
import UI, {Suite} from '../../../src/ui';

describe(`ui`, () => {
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
          setContext: sandbox.stub()
        })({rootSuite});
        expect(ui.setContext)
          .to
          .have
          .been
          .calledWithExactly(rootSuite);
      });
    });

    describe(`if not given a rootSuite property`, () => {
      it(`should call setSuiteContext()`, () => {
        const ui = UI.methods({
          setContext: sandbox.spy(UI.fixed.methods.setContext)
        })();
        expect(ui.setContext)
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
      });

      describe(`setSuiteContext()`, () => {
        it(`should set the Suite prop to be a factory having ref parent`,
          () => {
            const parent = Suite();
            ui.setContext(parent);
            expect(ui.Suite.fixed.refs.parent)
              .to
              .equal(parent);
          });
      });

      describe(`createSuite()`, () => {
        let suiteDef;

        beforeEach(() => {
          suiteDef = {
            title: 'my suite',
            func: _.noop
          };
          ui.Suite = ui.Suite.methods({
            execute: sandbox.stub()
          });
          sandbox.spy(ui, 'Suite');
          sandbox.stub(ui, 'setContext');
          sandbox.spy(ui, 'createSuite');
        });

        it(`should return a Suite`, () => {
          expect(ui.createSuite(suiteDef))
            .to
            .be
            .an('object');
        });

        it(`should instantiate a Suite`, () => {
          ui.createSuite(suiteDef);
          expect(ui.Suite)
            .to
            .have
            .been
            .calledWithExactly(suiteDef);
        });

        it(`should emit 'will-execute-suite'`, () => {
          expect(() => ui.createSuite(suiteDef))
            .to
            .emitFrom(ui, 'will-execute-suite');
        });

        it(`should call suite.execute()`, () => {
          const suite = ui.createSuite(suiteDef);
          expect(suite.execute)
            .to
            .have
            .been
            .calledOn(suite);
        });

        it(`should emit 'did-execute-suite'`, () => {
          expect(() => ui.createSuite(suiteDef))
            .to
            .emitFrom(ui, 'did-execute-suite');
        });
      });
    });
  });
});
