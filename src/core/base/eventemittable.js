'use strict';

import {EventEmitter} from 'events';
import stampit from 'stampit';
import {forEach, isError} from 'lodash';
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
    waitOn (event, opts = {}) {
      const start = Date.now();
      // jumping through a lot of hoops here to avoid depending on bluebird
      return new Promise((resolve, reject) => {
        let t;

        function listener (...args) {
          return args.length === 1 ? done(...args) : done(collapse(args));
        }

        function done (result) {
          clearTimeout(t);
          // TODO maybe debug elapsed time here
          const retval = opts.timer ? [Date.now() - start, result] : result;
          if (isError(result)) {
            // TODO debug error?  this should not happen.
          }
          resolve(retval);
        }

        this.once(event, listener);

        const timeout = opts.timeout;
        if (isFinite(timeout) && timeout > 0) {
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
