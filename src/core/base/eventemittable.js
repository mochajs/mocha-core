'use strict';

import {EventEmitter} from 'events';
import stampit from 'stampit';
import Promise from 'bluebird';
import {isEmpty, head, assign, forEach} from 'lodash';
import Mappable from './mappable';

function wait (event) {
  return new Promise(resolve => {
    this.once(event, (...args) => {
      if (isEmpty(args)) {
        return resolve();
      } else if (args.length === 1) {
        return resolve(head(args));
      }
      return resolve(args);
    });
  });
}

const EventEmittable = stampit.convertConstructor(EventEmitter)
  .static({
    createEventsFrom(opts = {}) {
      return this.refs({
        [opts.collection]: Mappable(assign({},
          this.fixed.refs[opts.collection],
          {
            [opts.event]: opts.action
          }))
      });
    },
    on(event, action) {
      const onEvents = assign({}, this.fixed.refs.onEvents, {
        [event]: action
      });
      return this.refs({onEvents});
    },
    once(event, action) {
      const onceEvents = assign({}, this.fixed.refs.onceEvents, {
        [event]: action
      });
      return this.refs({onceEvents});
    }
  })
  .methods({
    waitOn(event, timeout) {
      return isFinite(timeout) ? wait.call(this, event)
        .timeout(timeout) : wait.call(this, event);
    }
  })
  .static({
    init(...args) {
      return this.enclose(...args);
    }
  })
  .init(function initEventEmittable () {
    forEach(this.onEvents, (action, event) => this.on(event, action));
    forEach(this.onceEvents, (action, event) => this.once(event, action));
  });

export default EventEmittable;
