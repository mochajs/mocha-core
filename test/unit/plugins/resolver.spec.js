import resolver from '../../../src/plugins/resolver';
import {noop} from 'lodash';

const namespace = 'mocha';

describe('plugins/resolver', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('plugins/resolver');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('resolver()', () => {
    describe('when called without a parameter', () => {
      it('should not throw', () => {
        expect(resolver)
          .not
          .to
          .throw();
      });

      it('should return nothing', () => {
        expect(resolver()).to.be.undefined;
      });
    });

    describe('when called with a Function parameter', () => {
      it('should return the function', () => {
        expect(resolver(noop))
          .to
          .equal(noop);
      });
    });

    describe('when called with a string parameter', () => {
      let resolve;

      beforeEach(() => {
        resolve = sandbox.stub()
          .returns('lodash');
        resolver.__Rewire__('resolve', resolve);
      });

      afterEach(() => {
        resolver.__ResetDependency__('resolve');
      });

      it('should ask resolve-dep to find the module, which could be a plugin',
        () => {
          resolver('lodash');
          expect(resolve)
            .to
            .have
            .been
            .calledWithExactly([
              'lodash',
              `${namespace}-*-lodash`
            ]);
        });
    });
  });
});
