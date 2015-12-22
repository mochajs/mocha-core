'use strict';
const _ = require('lodash');

describe(`ui`, () => {
  const UI = require('../../../src/ui/index');

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
            func: _.noop
          }))
            .to
            .be
            .an('object');
        });
      });
    });
  });
});
