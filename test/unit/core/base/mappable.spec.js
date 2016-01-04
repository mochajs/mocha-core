'use strict';

describe(`core/base/mappable`, () => {
  const Mappable = require('../../../../src/core/base/mappable');

  describe(`Mappable()`, () => {
    let map;

    it(`should return a Map`, () => {
      expect(Mappable()).to.be.a(global.Map ? 'Map' : 'Object');
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

    it(`should support defaults`, () => {
      map = Mappable.refs({foo: 'bar'})();
      expect(map.foo)
        .to
        .equal('bar');
    });

    it(`should support fixed properties`, () => {
      map = Mappable.props({foo: 'bar'})({foo: 'baz'});
      expect(map.foo)
        .to
        .equal('bar');
      expect(map.get('foo'))
        .to
        .equal('baz');
    });
  });
});
