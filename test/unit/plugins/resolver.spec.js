import resolver from '../../../src/plugins/resolver';
import {noop} from 'lodash';

const namespace = 'mocha';
const resolve = resolver.resolve;

describe('plugins/resolver', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('plugins/resolver');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('resolve()', () => {
    describe('when called without a parameter', () => {
      it('should not throw', () => {
        expect(resolve)
          .not
          .to
          .throw();
      });

      it('should return nothing', () => {
        expect(resolve()).to.be.undefined;
      });
    });

    describe('when called with a Function parameter', () => {
      it('should return the function', () => {
        expect(resolve(noop))
          .to
          .equal(noop);
      });
    });

    describe('when called with a string parameter', () => {
      beforeEach(() => {
        sandbox.stub(resolver, 'resolveDep');
      });

      it('should ask resolve-dep to find the module, which could be a plugin',
        () => {
          resolve('lodash');
          expect(resolver.resolveDep)
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
