'use strict';

import {EventEmitter} from 'events';
import stampit from 'stampit';
import Promise from 'bluebird';
import _ from 'lodash';

function wait(event) {
  return new Promise(resolve => {
    this.once(event, (...args) => {
      if (_.isEmpty(args)) {
        return resolve();
      } else if (args.length === 1) {
        return resolve(_.first(args));
      }
      return resolve(args);
    });
  });
}

const EventEmittable = stampit.convertConstructor(EventEmitter)
  .static({
    on(event, action) {
      const onEvents = _.assign(this.fixed.refs.onEvents || {}, {
        [event]: action
      });
      return this.refs({onEvents});
    },
    once(event, action) {
      const onceEvents = _.assign(this.fixed.refs.onceEvents || {}, {
        [event]: action
      });
      return this.refs({onceEvents});
    }
  })
  .methods({
    waitOn(event, timeout) {
      return isFinite(timeout)
        ? wait.call(this, event).timeout(timeout)
        : wait.call(this, event);
    }
  })
  .static({
    init(...args) {
      return this.enclose(...args);
    }
  })
  .init(function initEventEmittable() {
    _.forEach(this.onEvents, (action, event) => this.on(event, action));
    _.forEach(this.onceEvents, (action, event) => this.once(event, action));
  });

export default EventEmittable;
