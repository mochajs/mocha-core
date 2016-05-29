import stampit from 'stampit';
import Executable from './executable';
import is from 'check-more-types';
import Context from './context';
import {typed} from '../core';

// todo put this and shit like it elsewhere
const ROOT_SUITE_ID = '__root__';

const Suite = stampit({
  refs: {
    parent: null,
    func: null,
    context: Context({id: ROOT_SUITE_ID})
  },
  props: {
    children: []
  },
  methods: {
    spawnContext () {
      return this.context.spawn();
    }
  },
  init () {
    if (is.function(this.title)) {
      this.func = this.title;
      this.title = '';
    }

    if (this.parent) {
      this.context = this.parent.spawnContext();
    }

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
  .on('execute:begin', function onExecuteBegin () {
    this.emit('suite:execute:begin');
  })
  .on('execute:end', function onExecuteEnd () {
    this.emit('suite:execute:end');
  });

export default Suite.static({root: Suite({id: ROOT_SUITE_ID})});
