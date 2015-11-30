'use strict';

describe(`core/eventemittable`, () => {
  const EventEmittable = require('../../src/core/eventemittable');
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/eventemittable');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`EventEmittable`, () => {
    it(`should return an object`, () => {
      expect(EventEmittable()).to.be.an('object');
    });

    it(`should implement EventEmitter`, done => {
      const ee = EventEmittable();
      ee.on('event', done);
      ee.emit('event');
    });

    describe(`static method`, () => {
      describe(`init()`, () => {
        it(`should allow a new stamp to be created`, () => {
          const stamp = EventEmittable.init(function () {
            this.foo = 'bar';
          });
          expect(stamp().foo).to.equal('bar');
        });
      });

      describe(`on()`, () => {
        it(`should register an on() listener upon instantiation`, () => {
          const stub = sandbox.stub();
          const thing = EventEmittable.on('foo', stub)();
          thing.emit('foo');
          thing.emit('foo');
          expect(stub).to.have.been.calledTwice;
        });
      });

      describe(`once()`, () => {
        it(`should register an once() listener upon instantiation`, () => {
          const stub = sandbox.stub();
          const thing = EventEmittable.once('foo', stub)();
          thing.emit('foo');
          thing.emit('foo');
          expect(stub).to.have.been.calledOnce;
        });
      });
    });

    describe(`method`, () => {
      describe(`waitOn()`, () => {
        it(`should return a Promise which is resolved when an event is emitted`,
          () => {
            const thing = EventEmittable();
            setImmediate(() => thing.emit('bar'));
            return expect(thing.waitOn('bar')).to.eventually.be.fulfilled;
          });

        describe(`if a numeric "timeout" parameter is supplied`, () => {
          it(`should timeout`, () => {
            const thing = EventEmittable();
            setTimeout(() => thing.emit('bar'), 20);
            return expect(thing.waitOn('bar', 10)).to.eventually.be.rejected;
          });
        });
      });
    });
  });
});
