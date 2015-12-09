'use strict';

const noop = require('lodash/utility/noop');

describe(`ui/`, () => {
  const ui = require('../../../src/ui');
  it(`should be an object`, () => {
    expect(ui).to.be.an('object');
  });

  describe(`method`, () => {
    describe(`add`, () => {
      it(`should be a function`, () => {
        expect(ui.add).to.be.a('function');
      });

      it(`should throw if not passed a string name`, () => {
        expect(ui.add).to.throw(Error);
      });

      it(`should throw if not passed a function func`, () => {
        expect(() => ui.add('foo')).to.throw(Error);
      });

      it(`should throw if an interface already exists with a given name`,
        () => {
          ui.add('foo', noop);
          expect(() => ui.add('foo', noop)).to.throw(Error);
        });
    });
  });
});
