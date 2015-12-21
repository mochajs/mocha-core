'use strict';
const noop = require('lodash/utility/noop');

describe(`ui`, () => {
  const UI = require('../../src/ui');

  describe(`UI()`, () => {
    describe(`method`, () => {
      let ui;

      beforeEach(() => {
        ui = UI();
      });

      describe(`createSuite()`, () => {
        it(`should return a Suite`, () => {
          expect(ui.createSuite({
            title: 'my suite',
            func: noop
          })).to.be.an('object');
        });
      });
    });
  });
});