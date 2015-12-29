'use strict';

describe(`core/base/eventemittable`, () => {
  const EventEmittable = require('../../../../src/core/base/eventemittable');
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/base/eventemittable');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`EventEmittable`, () => {
    it(`should return an object`, () => {
      expect(EventEmittable())
        .to
        .be
        .an('object');
    });

    it(`should implement EventEmitter`, () => {
      const ee = EventEmittable();
      expect(() => ee.emit('event'))
        .to
        .emitFrom(ee, 'event');
    });

    describe(`static method`, () => {
      describe(`init()`, () => {
        it(`should allow a new stamp to be created`, () => {
          const stamp = EventEmittable.init(function() {
            this.foo = 'bar';
          });
          expect(stamp().foo)
            .to
            .equal('bar');
        });
      });

      describe(`on()`, () => {
        it(`should register an on() listener upon instantiation`, () => {
          const stub = sandbox.stub();
          const ee = EventEmittable.on('foo', stub)();
          ee.emit('foo');
          ee.emit('foo');
          expect(stub).to.have.been.calledTwice;
        });
      });

      describe(`once()`, () => {
        it(`should register an once() listener upon instantiation`, () => {
          const stub = sandbox.stub();
          const ee = EventEmittable.once('foo', stub)();
          ee.emit('foo');
          ee.emit('foo');
          expect(stub).to.have.been.calledOnce;
        });
      });
    });

    describe(`method`, () => {
      let ee;

      beforeEach(() => {
        ee = EventEmittable();
      });

      describe(`waitOn()`, () => {
        it(`should return a Promise which is resolved when an event is emitted`,
          () => {
            const t = setTimeout(() => ee.emit('bar'));
            return expect(ee.waitOn('bar'))
              .to
              .eventually
              .be
              .undefined
              .then(() => clearTimeout(t));
          });

        describe(`if a finite "timeout" parameter is supplied`, () => {
          it(`should timeout`, () => {
            return expect(ee.waitOn('bar', 10)).to.eventually.be.rejected;
          });
        });

        describe(`if a non-finite "timeout" parameter is supplied`, () => {
          it(`should not timeout`, () => {
            return expect(ee.waitOn('bar', Infinity)).to.eventually.be.resolved;
          });
        });

        describe(`if the event emits a single parameter`, () => {
          it(`should return the parameter`, () => {
            const t = setTimeout(() => ee.emit('bar', 'baz'));
            return expect(ee.waitOn('bar'))
              .to
              .eventually
              .equal('baz')
              .then(() => clearTimeout(t));
          });
        });

        describe(`if the event emits multiple parameters`, () => {
          it(`should return them as an array`, () => {
            const t = setTimeout(() => ee.emit('bar', 'baz', 'quux'));
            return expect(ee.waitOn('bar'))
              .to
              .eventually
              .eql([
                'baz',
                'quux'
              ])
              .then(() => clearTimeout(t));
          });
        });

        describe(`if the event emits no parameters`, () => {
          it(`should return nothing`, () => {
            const t = setTimeout(() => ee.emit('bar'));
            return expect(ee.waitOn('bar'))
              .to
              .eventually
              .be
              .undefined
              .then(() => clearTimeout(t));
          });
        });
      });
    });
  });
});
