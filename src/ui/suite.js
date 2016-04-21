import stampit from 'stampit';
import Executable from './executable';
import {EventEmittable} from '../core';

const Suite = stampit({
  refs: {
    parent: null,
    func: null
  },
  props: {
    children: [],
    tests: []
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
    run () {
      this.emit('will-run');
      return this.execute({force: true})
        .then(({result}) => {
          this.result = result;
          this.emit('did-run');
          return this;
        });
    }
  },
  init () {
    if (this.parent) {
      this.parent.addChildSuite(this);
    }

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
      }
    });
  }
})
  .compose(Executable, EventEmittable);

export default Suite;
