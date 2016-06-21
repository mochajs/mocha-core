import stampit from 'stampit';
import Executable from './executable';
import Context from './context';
import {constant} from 'kefir';
import {concat, flatMap} from 'lodash/fp';

const Suite = stampit({
  refs: {
    context: Context({root: true})
  },
  props: {
    root: false,
    tests: [],
    preHooks: [],
    preEachHooks: [],
    postHooks: [],
    postEachHooks: []
  },
  methods: {
    spawnContext () {
      return this.context.spawn();
    },
    executables () {
      // TODO pipe()
      return constant(concat(this.preHooks, [
        flatMap(test => concat(this.preEachHooks, [
          test,
          this.postEachHooks
        ]), this.tests),
        this.postHooks
      ]))
        .flatten();
    }
  },
  init () {
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

    if (this.parent) {
      this.preEachHooks =
        this.preEachHooks.concat(this.parent.preEachHooks.slice());
      this.postEachHooks =
        this.postEachHooks.concat(this.parent.postEachHooks.slice());
    }
  }
})
  .compose(Executable);

export const rootSuite = Suite({root: true, title: 'ROOT SUITE'});
export default Suite;
