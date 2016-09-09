import stampit from 'stampit';
import {stream} from 'kefir';
import Executable from './executable';
import Context from './context';
import {EventEmittable} from '../core';
import Test from './test';
import {always, assign, prop, pick} from 'lodash/fp';

const Suite = stampit({
  refs: {
    context: Context({root: true})
  },
  props: {
    root: false,
    parent: null
  },
  methods: {
    spawnContext () {
      return this.context.spawn();
    },
    createTest (definition = {}, opts = {}) {
      const test = Test(assign(definition, {
        parent: this,
        opts
      }));
      this.runnables.emitEvent({
        type: 'value',
        value: test
      });
      return test;
    },
    createSuite (definition = {}, opts = {}) {
      return Suite(assign(definition, {
        parent: this,
        queue$: this.queue$,
        opts
      }));
    },
    flush () {
      // setImmediate(() => this.runnables.end());
      // this.runnables.end();
      // const retval = this.runnables$.onValue(value => {
      //   console.log(value);
      // })
      //   .flatten();
      // setImmediate(() => this.runnables.end());
      // return retval;
    },
    toString () {
      return `<Suite "${this.title}">`;
    },
    toJSON () {
      return pick([
        'id',
        'title',
        'fullTitle'
      ]);
    }
  },
  init () {
    this.runnables$ = stream(emitter => {
      this.runnables = emitter;
    })
      .bufferWhile(always(true))
      .flatten();

    this.runnables$.observe({
      error: err => {
        this.emit('error', err);
      }
    });

    Object.defineProperties(this, {
      // array for reporter to format as necessary
      fullTitle: {
        get () {
          const parent = this.parent;
          if (parent) {
            return parent.fullTitle.concat(this.title);
          }
          return [this.title];
        },
        configurable: true
      }
    });
  }
})
  .compose(Executable, EventEmittable);

export default Suite;
