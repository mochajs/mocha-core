import Context from '../../../src/ui/context';

describe('ui/context', () => {
  describe('Context()', () => {
    it('should be a function', () => {
      expect(Context)
        .to
        .be
        .a('function');
    });

    it('should return an object', () => {
      expect(Context())
        .to
        .be
        .an('object');
    });
  });
});
