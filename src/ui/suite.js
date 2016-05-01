import stampit from 'stampit';
import Executable from './executable';
import is from 'check-more-types';

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
    spawnContext () {
      return this.context.spawn();
    }
  },
  init () {
    if (this.parent) {
      this.parent.addChildSuite(this);
    }

    if (is.function(this.title)) {
      this.func = this.title;
      this.title = '';
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
  .compose(Executable);

export default Suite;
