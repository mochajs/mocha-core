import {Taggable} from '../core';
import Executable from './executable';
import {invoke, pick} from 'lodash/fp';
import {merge, constant, fromEvents} from '../ext/kefir';
import stampit from '../ext/stampit';

const Test = stampit({
  init () {
    this.preTests$ = fromEvents(this, 'pre-test');
    this.postTests$ = fromEvents(this, 'post-test');
  },
  methods: {
    toString () {
      return `<Test "${this.title}">`;
    },
    toJSON () {
      return pick([
        'id',
        'title',
        'fullTitle'
      ], this);
    },
    attach (parent) {
      this.parent = parent;
      parent.preTests$.observe({
        value: hook => {
          this.emit('pre-test', hook);
        }
      });
      parent.postTests$.observe({
        value: hook => {
          this.emit('post-test', hook);
        }
      });
      return constant(this);
    },
    run () {
      return merge([
        this.preTests$,
        constant(this),
        this.postTests$
      ])
        .flatMapConcat(invoke('execute'));
    }
  }
})
  .compose(Executable, Taggable);

export default Test;
