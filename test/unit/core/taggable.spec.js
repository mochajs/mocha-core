'use strict';

import Taggable from '../../../src/core/taggable';

const SET = global.Set ? 'Set' : 'Object';

describe(`core/base/taggable`, () => {
  describe(`Taggable()`, () => {
    describe(`static method`, () => {
      describe(`tag()`, () => {
        it(`should cause the instantiated object to have a Set "tags" prop`,
          () => {
            const obj = Taggable.tag('foo', 'bar')();
            expect(obj.tags)
              .to
              .be
              .a(SET);
          });

        it(`should each each argument to the instantiated object's "tags" prop`,
          () => {
            const obj = Taggable.tag('foo', 'bar')();
            expect(obj.tags.has('foo')).to.be.true;
            expect(obj.tags.has('bar')).to.be.true;
          });

        it(`should merge any tags in the instance`, () => {
          const obj = Taggable.tag('foo', 'bar')({tags: ['baz']});
          expect(obj.tags.has('foo')).to.be.true;
          expect(obj.tags.has('bar')).to.be.true;
        });
      });

      describe(`tags()`, () => {
        it(`should alias tag()`, () => {
          expect(Taggable.tag)
            .to
            .equal(Taggable.tags);
        });
      });
    });
  });
});
