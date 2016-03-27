import stampit from 'stampit';
import {Unique, EventEmittable} from '../core';
import is from 'check-more-types';
import _ from 'lodash';

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
      if (!this.pending && is.function(this.func)) {
        this.func();
      }
    }
  },
  init () {
    _.defaults(this, {
      children: [],
      tests: []
    });

    if (this.parent) {
      this.parent.addChildSuite(this);
    }

    this.context = _.create(_.get(this, 'parent.context', {}));

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
            (this.parent.pending || is.not.function(this.func));
        },
        set (value) {
          if (this.parent) {
            if (is.function(this.func)) {
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
