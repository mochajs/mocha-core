import _ from 'lodash';
import {UI, Suite} from '../../../src/ui';
import {EventEmittable} from '../../../src/core';

describe('ui/ui', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('ui/ui');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('UI()', () => {
    it('should use the same rootSuite if none specified', () => {
      expect(UI().rootSuite)
        .to
        .equal(UI().rootSuite);
    });

    it('should call setContext()', () => {
      const rootSuite = Suite();
      sandbox.stub(UI.fixed.methods, 'setContext');
      const ui = UI({rootSuite});
      expect(ui.setContext)
        .to
        .have
        .been
        .calledWithExactly(rootSuite);
    });

    it('should call setContext()', () => {
      const ui = UI.methods({
        setContext: sandbox.spy(UI.fixed.methods.setContext)
      })({rootSuite: Suite()});
      expect(ui.setContext)
        .to
        .have
        .been
        .calledWithExactly(ui.Suite.fixed.refs.parent);
    });

    describe('method', () => {
      let ui;
      let parent;
      let delegate;

      beforeEach(() => {
        delegate = EventEmittable();
        ui = UI({
          rootSuite: Suite(),
          delegate
        });
        parent = Suite();
      });

      describe('setContext()', () => {
        it('should set the Suite prop to be a factory having parent ref',
          () => {
            ui.setContext(parent);
            expect(ui.Suite.fixed.refs.parent)
              .to
              .equal(parent);
          });

        describe('Suite prop', () => {
          beforeEach(() => {
            ui.setContext(parent);
          });

          describe('when instantiated', () => {
            let suite;
            let ctx;

            beforeEach(() => {
              ctx = {};
              sandbox.stub(parent, 'spawnContext')
                .returns(ctx);
              sandbox.stub(ui.Suite.fixed.methods, 'once');
              suite = ui.Suite();
            });

            it('should call spawnContext() on the parent suite', () => {
              expect(parent.spawnContext).to.have.been.calledOnce;
            });

            it(
              'should set the "context" prop to the return value of the spawnContext() call',
              () => {
                expect(suite.context)
                  .to
                  .equal(ctx);
              });

            it('should listen for event "will-execute"', () => {
              expect(suite.once)
                .to
                .have
                .been
                .calledWith('will-execute');
            });

            it('should listen for event "did-execute"', () => {
              expect(suite.once)
                .to
                .have
                .been
                .calledWith('did-execute');
            });
          });
        });

        describe('and when "will-execute" is emitted', () => {
          it('should call setContext() with the Suite', () => {
            const suite = ui.Suite();
            sandbox.stub(ui, 'setContext');
            suite.emit('will-execute', suite);
            expect(ui.setContext)
              .to
              .have
              .been
              .calledWithExactly(suite);
          });
        });

        describe('and when "did-execute" is emitted', () => {
          it('should call setContext() with the Suite\'s parent', () => {
            const suite = ui.Suite();
            sandbox.stub(ui, 'setContext');
            suite.emit('did-execute', suite);
            expect(ui.setContext)
              .to
              .have
              .been
              .calledWithExactly(suite.parent);
          });
        });
      });

      describe('createTest()', () => {
        let testDef;
        let opts;

        beforeEach(() => {
          testDef = {
            title: 'my test',
            func: _.noop,
            parent: Suite()
          };
          opts = {};
          sandbox.stub(ui, 'broadcast');
        });

        it('should return a Test', () => {
          expect(ui.createTest(testDef))
            .to
            .be
            .an('object');
        });

        it('should instantiate a Test', () => {
          sandbox.spy(ui, 'Test');
          ui.createTest(testDef);
          expect(ui.Test)
            .to
            .have
            .been
            .calledWithExactly(testDef);
        });

        it('should broadcast on the "test" channel', () => {
          const test = ui.createTest(testDef, opts);
          expect(ui.broadcast)
            .to
            .have
            .been
            .calledWithExactly('test', test, opts);
        });
      });

      describe('retries()', () => {
        beforeEach(() => {
          sandbox.stub(ui.context, 'retries');
        });

        it("should call the Context's retries()", () => {
          ui.retries(4);
          expect(ui.context.retries)
            .to
            .have
            .been
            .calledWithExactly(4);
        });

        it('should return the UI', () => {
          expect(ui.retries(2))
            .to
            .equal(ui);
        });
      });

      describe('createSuite()', () => {
        let suiteDef;
        let opts;

        beforeEach(() => {
          suiteDef = {
            title: 'my suite',
            func: _.noop
          };
          opts = {};
          sandbox.stub(ui.Suite.fixed.methods, 'execute')
            .returns(new Promise(resolve => resolve()));
          sandbox.stub(ui, 'broadcast');
          sandbox.spy(ui, 'Suite');
          sandbox.stub(ui, 'setContext');
        });

        it('should return a Suite', () => {
          expect(ui.createSuite(suiteDef))
            .to
            .be
            .an('object');
        });

        it('should instantiate a Suite', () => {
          ui.createSuite(suiteDef);
          expect(ui.Suite)
            .to
            .have
            .been
            .calledWithExactly(suiteDef);
        });

        it('should broadcast on the "suite" channel', () => {
          const suite = ui.createSuite(suiteDef, opts);
          expect(ui.broadcast)
            .to
            .have
            .been
            .calledWithExactly('suite', suite, opts);
        });
      });
    });
  });
});
