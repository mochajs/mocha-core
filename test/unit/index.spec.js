'use strict';

describe(`main`, () => {
  it(`should return a Mocha instance`, () => {
    expect(require('../../src')).to.be.an('object');
  });
});
