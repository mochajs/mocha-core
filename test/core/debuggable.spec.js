'use strict';

describe(`core/debuggable`, () => {
  const Debuggable = require('../../src/core/debuggable');
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/debuggable');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Debuggable()`, () => {
    describe(`static method`, () => {
      describe(`namespace()`, () => {
        let stamp;

        beforeEach(() => {
          stamp = Debuggable.namespace('foo');
        });

        it(`should create a debug() method on the instance`, () => {
          expect(stamp().debug).to.be.a('function');
        });
      });
    });
  });
});
