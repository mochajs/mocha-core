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
    it(`should call setContext()`, () => {
      const rootSuite = Suite();
      sandbox.stub(UI.fixed.methods, 'setContext');
      const ui = UI({rootSuite});
      expect(ui.setContext)
        .to
        .have
        .been
        .calledWithExactly(rootSuite);
    });

    describe(`if not given a rootSuite property`, () => {
      it(`should call setContext()`, () => {
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
      let parent;

      beforeEach(() => {
        ui = UI();
        parent = Suite();
      });

      describe(`setContext()`, () => {
        it(`should set the Suite prop to be a factory having parent ref`,
          () => {
            ui.setContext(parent);
            expect(ui.Suite.fixed.refs.parent)
              .to
              .equal(parent);
          });

        it(`should subscribe to the Suite's "execute:pre" event`, () => {
          ui.setContext(parent);
          expect(ui.Suite.fixed.refs.onceEvents['execute:pre'])
            .to
            .be
            .a('function');
        });

        describe(`when the UI is recursive`, () => {
          beforeEach(() => {
            ui.setContext(parent);
          });

          it(`should subscribe to the Suite's "execute:post" event`, () => {
            expect(ui.Suite.fixed.refs.onceEvents['execute:post'])
              .to
              .be
              .a('function');
          });
        });

        describe(`when the UI is not recursive`, () => {
          beforeEach(() => {
            ui.recursive = false;
            ui.setContext(parent);
          });

          it(`should not subscribe to the Suite's "execute:post" event`, () => {
            expect(ui.Suite.fixed.refs.onceEvents['execute:post']).to.be.undefined;
          });
        });

        it(`should set the Test prop to be a factory having suite ref`, () => {
          ui.setContext(parent);
          expect(ui.Test.fixed.refs.suite)
            .to
            .equal(parent);
        });
      });

      describe(`createTest()`, () => {
        let testDef;

        beforeEach(() => {
          testDef = {
            title: 'my test',
            func: _.noop,
            suite: Suite()
          };
        });

        it(`should return a Test`, () => {
          expect(ui.createTest(testDef))
            .to
            .be
            .an('object');
        });

        it(`should instantiate a Test`, () => {
          sandbox.spy(ui, 'Test');
          ui.createTest(testDef);
          expect(ui.Test)
            .to
            .have
            .been
            .calledWithExactly(testDef);
        });
      });

      describe(`createSuite()`, () => {
        let suiteDef;

        beforeEach(() => {
          suiteDef = {
            title: 'my suite',
            func: _.noop
          };
          sandbox.stub(ui.Suite.fixed.methods, 'execute');
          sandbox.spy(ui, 'Suite');
          sandbox.stub(ui, 'setContext');
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
      });
    });
  });
});
