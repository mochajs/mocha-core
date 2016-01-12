'use strict';

import mocha from '../../src/';

describe(`main`, () => {
  it(`should return a Mocha instance`, () => {
    expect(mocha).to.be.an('object');
  });
});
