import stampit from 'stampit';
import {Pluggable} from './plugins';
import {UI} from './ui';
import {Runner} from './runner';
import {Reporter} from './reporter';
import {API} from './core';
import pkg from './options/package';
import {WeakSet} from './util';

function bucketize (executable, opts = {}) {
  if (opts.only) {
    this.only.add(executable);
  } else if (opts.skip) {
    this.skip.add(executable);
  }
}

const Mocha = stampit({
  refs: {
    only: new WeakSet(),
    skip: new WeakSet(),
    version: pkg.version
  },
  props: {
    plugins: {}
  },
  methods: {
    createUI (properties = {}) {
      return this.createAPI(UI, properties);
    },
    createRunner (properties = {}) {
      return this.createAPI(Runner, properties);
    },
    createReporter (properties = {}) {
      return this.createAPI(Reporter, properties);
    }
  }
})
  .compose(Pluggable, API)
  .on('suite:created', bucketize)
  .on('test:created', bucketize)
  .init(function init () {
    this.use(this.ui)
      .use(this.runner);
  });

export default Mocha.refs({Mocha});
