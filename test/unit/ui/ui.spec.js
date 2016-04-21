import _ from 'lodash';
import {UI, Suite} from '../../../src/ui';

describe('ui/ui', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('ui/ui');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('UI()', () => {
    it('should throw if not passed a rootSuite', () => {
      expect(UI)
        .to
        .throw(Error);
    });

    it('should set the factory prop to the stamp', () => {
      const ui = UI({rootSuite: Suite()});
      expect(ui)
        .to
        .have
        .property('factory', UI);
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
        delegate = {
          addOnly: sandbox.spy(),
          removeOnly: sandbox.spy(),
          addSkipped: sandbox.spy(),
          removeSkipped: sandbox.spy()
        };
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

        it('should subscribe to the Suite\'s "will-run" event', () => {
          ui.setContext(parent);
          expect(ui.Suite.fixed.refs.onceEvents['will-run'])
            .to
            .be
            .a('function');
        });

        describe('and when "did-run" is emitted', () => {
          it('should call setContext() with the Suite', () => {
            const suite = ui.Suite();
            sandbox.stub(ui, 'setContext');
            suite.emit('will-run', suite);
            expect(ui.setContext)
              .to
              .have
              .been
              .calledWithExactly(suite);
          });
        });

        describe('and when the UI is recursive', () => {
          beforeEach(() => {
            ui.setContext(parent);
          });

          it('should subscribe to the Suite\'s "did-run" event', () => {
            expect(ui.Suite.fixed.refs.onceEvents['did-run'])
              .to
              .be
              .a('function');
          });

          describe('and when "did-run" is emitted', () => {
            it('should call setContext() with the Suite\'s parent', () => {
              const suite = ui.Suite();
              sandbox.stub(ui, 'setContext');
              suite.emit('did-run', suite);
              expect(ui.setContext)
                .to
                .have
                .been
                .calledWithExactly(suite.parent);
            });
          });
        });

        describe('when the UI is not recursive', () => {
          beforeEach(() => {
            ui.recursive = false;
            ui.setContext(parent);
          });

          it('should not subscribe to the Suite\'s "did-run" event', () => {
            expect(ui.Suite.fixed.refs.onceEvents['did-run']).to.be.undefined;
          });
        });

        it('should set the Test prop to be a factory having suite ref', () => {
          ui.setContext(parent);
          expect(ui.Test.fixed.refs.parent)
            .to
            .equal(parent);
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

        describe('when called with truthy "only" option', () => {
          beforeEach(() => {
            sandbox.stub(ui, 'addOnly');
          });

          it('should add the suite to the "only" Set', () => {
            opts.only = true;
            const test = ui.createTest(testDef, opts);
            expect(ui.addOnly)
              .to
              .have
              .been
              .calledWithExactly(test);
          });
        });
      });

      describe('addOnly(), removeOnly(), addSkipped(), removeSkipped()', () => {
        [
          'addOnly',
          'removeOnly',
          'addSkipped',
          'removeSkipped'
        ].forEach(method => {
          let obj;

          beforeEach(() => {
            obj = {};
          });

          describe(`${method}()`, () => {
            it('should delegate to the delegate', () => {
              ui[method](obj);
              expect(ui.delegate[method])
                .to
                .have
                .been
                .calledWithExactly(obj);
            });

            it('should return the UI', () => {
              expect(ui[method](obj))
                .to
                .equal(ui);
            });
          });
        });
      });

      describe('retries()', () => {
        beforeEach(() => {
          sandbox.stub(ui.context, 'retries');
        });

        it('should call the Context\'s retries()', () => {
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
          sandbox.stub(ui.factory, 'enqueueSuite');
          sandbox.stub(ui.Suite.fixed.methods, 'run')
            .returns(new Promise(resolve => resolve()));
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

        it('should enqueue the Suite to be run', () => {
          const suite = ui.createSuite(suiteDef);
          expect(ui.factory.enqueueSuite)
            .to
            .have
            .been
            .calledWithExactly(suite);
        });

        describe('when called with truthy "only" option', () => {
          beforeEach(() => {
            sandbox.stub(ui, 'addOnly');
          });

          it('should add the Suite to the "only" Set', () => {
            opts.only = true;
            const suite = ui.createSuite(suiteDef, opts);
            expect(ui.addOnly)
              .to
              .have
              .been
              .calledWithExactly(suite);
          });
        });
      });
    });
  });
});
