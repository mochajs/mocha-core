'use strict';

import {Result} from '../../../src/ui';

describe(`ui/result`, () => {
  describe(`Result()`, () => {
    it(`should return an object`, () => {
      expect(Result())
        .to
        .be
        .an('object');
    });
  });

  describe(`method`, () => {
    let result;

    beforeEach(() => {
      result = Result({fulfilled: 'skipped'});
    });

    describe(`toJSON()`, () => {
      it(`should return an object without null, undefined, or Function values`,
        () => {
          expect(result.toJSON()).to.eql({
            fulfilled: 'skipped',
            completed: false,
            aborted: false
          });
        });
    });
  });
});
