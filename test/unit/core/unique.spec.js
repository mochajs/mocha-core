import Unique from '../../../src/core/unique';

describe('core/unique', () => {
  describe('Unique()', () => {
    const regex = /[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}/;

    it('should return an object with a Symbol "id" property', () => {
      expect(Unique().id)
        .to
        .match(regex);
    });

    it('should assign an id to objects created by stamps composed from this stamp',
      () => {
        expect(Unique.methods({})().id)
          .to
          .match(regex);
      });
  });
});
