'use strict';

import Mocha from '../../src/mocha';

describe(`mocha`, () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('mocha');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Mocha()`, () => {
    beforeEach(() => {
      sandbox.stub(Mocha.fixed.methods, 'use');
    });

    it(`should use the default ui`, () => {
      const mocha = Mocha();

      expect(mocha.use)
        .to
        .have
        .been
        .calledWithExactly(mocha.ui);
    });
  });
});
