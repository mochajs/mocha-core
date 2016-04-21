import stampit from 'stampit';
import {Pluggable} from './plugins';
import UI, {Suite} from './ui';
import Reporter from './reporter';
import {defaults} from 'lodash/fp';
import {API} from './core';
import pkg from './options/package';
import {Set} from './util';

const Mocha = stampit({
  refs: {
    plugins: {},
    version: pkg.version
  },
  props: {
    reporters: []
  },
  methods: {
    createUI (properties = {}) {
      return this.createAPI(UI, defaults({
        rootSuite: this.rootSuite
      }, properties));
    },
    createReporter (properties = {}) {
      return this.createAPI(Reporter, properties);
    },
    addOnly (obj) {
      this.only.add(obj);
      return this;
    },
    removeOnly (obj) {
      this.only.delete(obj);
      return this;
    },
    addSkipped (obj) {
      this.skipped.add(obj);
      obj.pending = true;
      return this;
    },
    removeSkipped (obj) {
      this.skipped.remove(obj);
      obj.pending = false;
      return this;
    }
  },
  init () {
    this.rootSuite = Suite();
  }
})
  .compose(Pluggable, API)
  .init(function initMochaPlugins () {
    this.only = new Set();
    this.skipped = new Set();

    if (this.ui) {
      this.use(this.ui);
    }
  });

export default Mocha.refs({Mocha});
