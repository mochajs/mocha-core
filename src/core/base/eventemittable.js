'use strict';

import {EventEmitter} from 'events';
import stampit from 'stampit';
import forEach from 'lodash/forEach';
import {collapse} from '../../util';

const EventEmittable = stampit.convertConstructor(EventEmitter)
  .static({
    on (event, action) {
      const onEvents = Object.assign({}, this.fixed.refs.onEvents, {
        [event]: action
      });
      return this.refs({onEvents});
    },
    once (event, action) {
      const onceEvents = Object.assign({}, this.fixed.refs.onceEvents, {
        [event]: action
      });
      return this.refs({onceEvents});
    }
  })
  .methods({
    waitOn (event, timeout) {
      // jumping through a lot of hoops here to avoid depending on bluebird
      return new Promise((resolve, reject) => {
        let t;

        function listener (...args) {
          return args.length === 1 ? done(...args) : done(collapse(args));
        }

        function done (result) {
          clearTimeout(t);
          resolve(result);
        }

        this.once(event, listener);

        if (isFinite(timeout)) {
          t = setTimeout(() => {
            this.removeListener(event, listener);
            reject(new Error(`Timed out while waiting for "${event} (${timeout}ms)"`));
          }, timeout);
        }
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
    forEach(this.onEvents, (action, event) => this.on(event, action));
    forEach(this.onceEvents, (action, event) => this.once(event, action));
  });

export default EventEmittable;
