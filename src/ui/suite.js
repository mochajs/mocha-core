import stampit from '../ext/stampit';
import {merge, fromEvents} from '../ext/kefir';
import Executable from './executable';
import Context from './context';
import {EventEmittable} from '../core';
import Test from './test';
import Hook from './hook';
import {pipe, eq, prop, assign, invoke, pick} from 'lodash/fp';

const PRE_SUITE = 'pre-suite';
const POST_SUITE = 'post-suite';
const PRE_TEST = 'pre-test';
const POST_TEST = 'post-test';

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
    createChild (Factory, definition = {}, opts = {}) {
      const child = Factory(assign(definition, {opts}));
      this.emit('child', child);
      return child;
    },
    attach (parent) {
      this.parent = parent;
      parent.preTests$.observe({
        value: hook => {
          this.emit(PRE_TEST, hook);
        }
      });
      parent.postTests$.observe({
        value: hook => {
          this.emit(POST_TEST, hook);
        }
      });
      return this.execute();
    },
    createTest (definition = {}, opts = {}) {
      this.createChild(Test, definition, opts);
    },
    createSuite (definition = {}, opts = {}) {
      this.createChild(Suite, definition, opts);
    },
    createHook (definition = {}, opts = {}) {
      this.createChild(Hook, definition, opts);
    },
    toString () {
      return `<Suite "${this.title}">`;
    },
    toJSON () {
      return pick([
        'id',
        'title',
        'fullTitle'
      ], this);
    },
    run () {
      return merge([
        this.preSuites$,
        this.children$,
        this.postSuites$
      ])
        .flatMapConcat(invoke('run')).log();
    }
  },
  init () {
    const children$ = fromEvents(this, 'child');

    children$.observe({
      value: child => {
        child.attach(this);
      }
    });

    const hook = prop('opts.hook');
    const hooks$ = children$.filter(hook);
    this.children$ = children$.reject(hook).log();
    this.preSuites$ = hooks$.filter(pipe(hook, eq(PRE_SUITE)));
    this.postSuites$ = hooks$.filter(pipe(hook, eq(POST_SUITE)));
    this.preTests$ = hooks$.filter(pipe(hook, eq(PRE_TEST)))
      .merge(fromEvents(this, PRE_TEST));
    this.postTests$ = hooks$.filter(pipe(hook, eq(POST_TEST)))
      .merge(fromEvents(this, POST_TEST));

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
