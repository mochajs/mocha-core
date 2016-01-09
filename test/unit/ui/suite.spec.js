'use strict';

import Suite from '$src/ui/suite';

describe('ui/suite', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('ui/suite');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Suite()`, () => {
    let func;
    beforeEach(() => {
      func = sandbox.spy();
    });

    it(`should return an object with a null "parent" prop`, () => {
      expect(Suite().parent).to.be.null;
    });

    it(`should return an object with a false "pending" prop`, () => {
      expect(Suite().pending).to.be.false;
    });

    it(`should return an object with an empty "children" prop`, () => {
      const suite = Suite();
      expect(suite.children)
        .to
        .be
        .an('array');
      expect(suite.children).to.be.empty;
    });

    describe(`when given a non-falsy "parent" prop`, () => {
      let parent;
      let rootSuite;

      beforeEach(() => {
        rootSuite = Suite();
        parent = Suite({parent: rootSuite});
        sandbox.stub(parent, 'addChildSuite')
          .returns(parent);
      });

      it(`should add the suite as a child of the parent`, () => {
        const suite = Suite({parent});
        expect(parent.addChildSuite)
          .to
          .have
          .been
          .calledWithExactly(suite);
      });

      describe(`if parent's "pending" prop is true`, () => {
        beforeEach(() => {
          parent.pending = true;
        });

        describe(`and function is not passed`, () => {
          it(`should inherit the "pending" prop`, () => {
            expect(Suite({parent}).pending).to.be.true;
          });
        });

        describe(`and function is passed`, () => {
          function func() {
          }

          it(`should inherit the "pending" prop`, () => {
            expect(Suite({
              parent,
              func
            }).pending).to.be.true;
          });
        });
      });

      describe(`if parent's "pending" prop is false`, () => {
        beforeEach(() => {
          parent.func = function() {
          };
        });

        describe(`and function is not passed`, () => {
          it(`should be pending`, () => {
            expect(Suite({parent}).pending).to.be.true;
          });
        });

        describe(`and function is passed`, () => {
          function func() {
          }

          it(`should inherit the "pending" prop`, () => {
            expect(Suite({
              parent,
              func
            }).pending).not.to.be.true;
          });
        });
      });
    });

    describe(`method`, () => {
      describe(`addChild()`, () => {
        it(`should add a suite to the "children" Array`, () => {
          const parent = Suite();
          const child = Suite();
          parent.addChildSuite(child);
          expect(parent.children[0])
            .to
            .equal(child);
        });
      });

      describe(`execute()`, () => {
        it(`should execute the "func" property in the suite's context`, () => {
          const suite = Suite({func});
          suite.execute();
          expect(func)
            .to
            .have
            .been
            .calledOn(suite);
        });
      });
    });
  });
});
