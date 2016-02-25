'use strict';

import stampit from 'stampit';
import {Unique, EventEmittable} from '../core';
import {defaults, create, get, isFunction} from 'lodash';

const Suite = stampit({
  refs: {
    parent: null,
    func: null
  },
  methods: {
    addChildSuite (suite) {
      this.children.push(suite);
      return this;
    },
    addTest (test) {
      this.tests.push(test);
      return this;
    },
    execute () {
      if (!this.pending && isFunction(this.func)) {
        this.func();
      }
    }
  },
  init () {
    defaults(this, {
      children: [],
      tests: []
    });

    if (this.parent) {
      this.parent.addChildSuite(this);
    }

    this.context = create(get(this, 'parent.context', {}));

    const func = this.func;

    Object.defineProperties(this, {
      fullTitle: {
        get () {
          let suite = this;
          const fullTitle = [];
          while (suite && suite.title) {
            fullTitle.unshift(suite.title);
            suite = suite.parent;
          }
          return fullTitle.join(' ');
        }
      },
      pending: {
        get () {
          return Boolean(this.parent) &&
            (this.parent.pending || !isFunction(this.func));
        },
        set (value) {
          if (this.parent) {
            if (isFunction(this.func)) {
              if (value) {
                this.func = null;
              }
            } else if (!value) {
              this.func = func;
            }
          }
        }
      }
    });

    this.emit('execute:pre', this);
    this.execute();
    this.emit('execute:post', this);
  }
})
  .compose(Unique, EventEmittable);

export default Suite;
