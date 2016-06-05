import {EventEmittable} from '../../../src/core';
import {noop} from 'lodash';

describe('core/eventemittable', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/eventemittable');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('EventEmittable', () => {
    it('should return an object', () => {
      expect(EventEmittable())
        .to
        .be
        .an('object');
    });

    it('should implement EventEmitter', () => {
      const ee = EventEmittable();
      expect(() => ee.emit('event'))
        .to
        .emitFrom(ee, 'event');
    });

    it('should register events specified in prop "onEvents"', () => {
      sandbox.stub(EventEmittable.fixed.methods, 'on');
      EventEmittable({onEvents: {foo: noop}});
      expect(EventEmittable.fixed.methods.on)
        .to
        .have
        .been
        .calledWithExactly('foo', noop);
    });

    it('should register events specified in prop "onceEvents"', () => {
      sandbox.stub(EventEmittable.fixed.methods, 'once');
      EventEmittable({onceEvents: {foo: noop}});
      expect(EventEmittable.fixed.methods.once)
        .to
        .have
        .been
        .calledWithExactly('foo', noop);
    });

    describe('static method', () => {
      describe('init()', () => {
        it('should allow a new stamp to be created', () => {
          const stamp = EventEmittable.init(function () {
            this.foo = 'bar';
          });
          expect(stamp().foo)
            .to
            .equal('bar');
        });
      });

      describe('on()', () => {
        it('should add an "on" event to the Factory', () => {
          expect(EventEmittable.on('foo', noop))
            .to
            .have
            .deep
            .property('fixed.refs.onEvents.foo', noop);
        });
      });

      describe('once()', () => {
        it('should add an "once" event to the Factory', () => {
          expect(EventEmittable.once('foo', noop))
            .to
            .have
            .deep
            .property('fixed.refs.onceEvents.foo', noop);
        });
      });
    });

    describe('method', () => {
      let ee;

      beforeEach(() => {
        ee = EventEmittable();
      });

      describe('waitOn()', () => {
        it('should return a Promise which is resolved when an event is emitted',
          () => {
            setTimeout(() => ee.emit('bar'));
            return expect(ee.waitOn('bar')).to.eventually.be.undefined;
          });

        describe('if a finite "timeout" option is supplied', () => {
          it('should timeout', () => {
            return expect(ee.waitOn('bar',
              {timeout: 10})).to.eventually.be.rejected;
          });
        });

        describe('if a non-finite "timeout" parameter is supplied', () => {
          it('should not timeout', () => {
            return expect(ee.waitOn('bar',
              {timeout: Infinity})).to.eventually.be.resolved;
          });
        });

        describe('if a non-positive "timeout" parameter is supplied', () => {
          it('should not timeout', () => {
            return expect(ee.waitOn('bar',
              {timeout: 0})).to.eventually.be.resolved;
          });
        });

        describe('if the event emits a single parameter', () => {
          it('should return the parameter', () => {
            setTimeout(() => ee.emit('bar', 'baz'));
            return expect(ee.waitOn('bar'))
              .to
              .eventually
              .equal('baz');
          });
        });

        describe('if the event emits multiple parameters', () => {
          it('should return them as an array', () => {
            setTimeout(() => ee.emit('bar', 'baz', 'quux'));
            return expect(ee.waitOn('bar'))
              .to
              .eventually
              .eql([
                'baz',
                'quux'
              ]);
          });
        });

        describe('if the event emits no parameters', () => {
          it('should return nothing', () => {
            setTimeout(() => ee.emit('bar'));
            return expect(ee.waitOn('bar')).to.eventually.be.undefined;
          });
        });
      });
    });
  });
});
