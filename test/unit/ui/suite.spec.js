'use strict';

describe('ui/suite', () => {
  const Suite = require('../../../src/ui/suite');

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
      expect(Suite({func}).parent).to.be.null;
    });

    describe(`method`, () => {
      describe(`run()`, () => {
        it(`should execute the "func" property`, () => {
          const suite = Suite({func});
          return suite.run()
            .then(() => {
              expect(func)
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
