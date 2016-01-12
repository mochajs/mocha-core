'use strict';

import stampit from 'stampit';
import EventEmittable from '../core/base/eventemittable';
import _ from 'lodash';

const Test = stampit({
  init() {
    this.suite.addTest(this);

    const func = this.func;

    Object.defineProperties(this, {
      pending: {
        get() {
          return !_.isFunction(this.func) || this.suite.pending;
        },
        set(value) {
          if (_.isFunction(this.func)) {
            if (value) {
              this.func = null;
            }
          } else if (value) {
            this.func = func;
          }
        }
      }
    });
  }
})
  .compose(EventEmittable);

export default Test;
