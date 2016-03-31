import stampit from 'stampit';
import {Pluggable} from './plugins';
import UI, {Suite} from './ui';
import Reporter from './reporter';
import {defaults} from 'lodash/fp';
import {API} from './core';

const Mocha = stampit({
  refs: {
    ui: 'bdd',
    plugins: {}
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
    }
  },
  init () {
    this.rootSuite = Suite();
  }
})
  .compose(Pluggable, API)
  .init(function initMochaPlugins () {
    this.reporter = new Set();
    this.use(this.ui);
  });

export default Mocha;
