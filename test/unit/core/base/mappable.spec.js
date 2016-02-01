'use strict';

import Mappable from '../../../../src/core/base/mappable';

describe(`core/base/mappable`, () => {
  describe(`Mappable()`, () => {
    let map;

    it(`should return a Map`, () => {
      expect(Mappable())
        .to
        .be
        .a(global.Map ? 'Map' : 'Object');
    });

    it(`should instantiate the Map with the instance object`, () => {
      map = Mappable({foo: 'bar'});
      expect(map.get('foo'))
        .to
        .equal('bar');
    });

    it(`should support custom methods`, () => {
      map = Mappable.methods({
        foo() {
        }
      })();
      expect(map.foo)
        .to
        .be
        .a('function');
    });

    it(`should support "refs()"`, () => {
      map = Mappable.refs({foo: 'bar'})();
      expect(map.foo)
        .to
        .equal('bar');
    });

    it(`should support "props()"`, () => {
      map = Mappable.props({foo: 'bar'})({foo: 'baz'});
      expect(map.foo)
        .to
        .equal('bar');
    });

    describe(`method`, () => {
      describe(`toJSON()`, () => {
        it(`should return a plain object representation ready for JSON`, () => {
          expect(Mappable({foo: 'bar'})
            .toJSON())
            .to
            .eql({foo: 'bar'});
        });
      });
    });
  });
});
