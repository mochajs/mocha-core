import stampit from 'stampit';
import Executable from './executable';
import Context from './context';
import {typed} from '../core';
import {forEach, getOr} from 'lodash/fp';

// todo put this and shit like it elsewhere
const ROOT_SUITE_ID = '__root__';

const HOOKS = [
  'pre',
  'post',
  'preEach',
  'postEach'
];

const Suite = stampit({
  refs: {
    parent: null,
    func: null,
    context: Context({id: ROOT_SUITE_ID})
  },
  props: {
    pre: [],
    post: [],
    preEach: [],
    postEach: []
  },
  methods: {
    spawnContext () {
      return this.context.spawn();
    }
  },
  init () {
    const getParentHooks = getOr([], this);
    forEach(hooks => {
      this[hooks].unshift(...getParentHooks(`parent.${hooks}`));
    }, HOOKS);

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
  .compose(Executable, typed('Suite'))
  .on('executable:execute:begin', function onExecuteBegin () {
    this.emit('suite:execute:begin');
  })
  .on('executable:execute:end', function onExecuteEnd () {
    this.emit('suite:execute:end');
  });

export default Suite.static({root: Suite({id: ROOT_SUITE_ID})});
