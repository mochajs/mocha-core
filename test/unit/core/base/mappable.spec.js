'use strict';

const MAP = global.Map ? 'Map' : 'Object';

describe(`core/base/mappable`, () => {
  const Mappable = require('../../../../src/core/base/mappable');

  describe(`Mappable()`, () => {
    let map;

    afterEach(() => {
      expect(map)
        .to
        .be
        .a(MAP);
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

    it(`should support instance props`, () => {
      map = Mappable({foo: 'bar'});
      expect(map.foo)
        .to
        .equal('bar');
    });

    it(`should support defaults`, () => {
      map = Mappable.refs({foo: 'bar'})({foo: 'baz'});
      expect(map.foo)
        .to
        .equal('baz');
    });

    it(`should support fixed properties`, () => {
      map = Mappable.props({foo: 'bar'})({foo: 'baz'});
      expect(map.foo)
        .to
        .equal('bar');
    });
  });
});
