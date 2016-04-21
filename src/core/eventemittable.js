import {EventEmitter} from 'events';
import stampit from 'stampit';
import is from 'check-more-types';
import {head, forEach, curry} from 'lodash/fp';
import {assign} from 'lodash';
import {Promise} from '../util';

const subscriber = curry(function subscriber (obj, type, events) {
  return forEach((action, event) => obj[type](event, action), events);
});

const EventEmittable = stampit.convertConstructor(EventEmitter)
  .static({
    on (event, action) {
      const onEvents = assign({}, this.fixed.refs.onEvents, {
        [event]: action
      });
      return this.refs({onEvents});
    },
    once (event, action) {
      const onceEvents = assign({}, this.fixed.refs.onceEvents, {
        [event]: action
      });
      return this.refs({onceEvents});
    }
  })
  .methods({
    waitOn (event, opts = {}) {
      // jumping through a lot of hoops here to avoid depending on bluebird
      return new Promise((resolve, reject) => {
        let fulfilled;

        function listener (...results) {
          fulfilled = true;

          if (is.empty(results)) {
            return resolve();
          }

          if (is.singularArray(results)) {
            results = head(results);
            if (is.error(results)) {
              return reject(results);
            }
          }

          resolve(results);
        }

        this.once(event, listener);

        const timeout = opts.timeout;

        setTimeout(() => {
          if (!fulfilled && is.finite(timeout) && is.positiveNumber(timeout)) {
            this.removeListener(event, listener);
            reject(new Error(`Timed out while waiting for "${event} (${timeout}ms)"`));
          }
        }, timeout);
      });
    }
  })
  .static({
    init (...args) {
      // ensure that EventEmitter's static init() function doesn't blow away
      // stampit's.
      return this.enclose(...args);
    }
  })
  .init(function initEventEmittable () {
    const subscribe = subscriber(this);
    subscribe('on', this.onEvents);
    subscribe('once', this.onceEvents);
  });

export default EventEmittable;
