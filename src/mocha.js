import stampit from 'stampit';
import {Pluggable} from './plugins';
import {UI} from './ui';
import {Runner} from './runner';
import {Reporter} from './reporter';
import {API} from './core';
import pkg from './options/package';
import {Kefir} from 'kefir';
import {assign} from 'lodash/fp';
import is from 'check-more-types';

const Mocha = stampit({
  refs: {
    version: pkg.version
  },
  props: {
    plugins: {}
  },
  methods: {
    createAPI (Factory, properties = {}) {
      if (is.not.function(Factory)) {
        throw new Error('Factory function required');
      }
      return Factory(assign({
        delegate: this,
        executable$: this.executable$
      }, properties));
    },
    createUI (properties = {}) {
      return this.createAPI(UI, properties);
    },
    createRunner (properties = {}) {
      return this.createAPI(Runner, properties);
    },
    createReporter (properties = {}) {
      return this.createAPI(Reporter, properties);
    }
  },
  init () {
    Object.defineProperties(this, {
      executable$: {
        value: Kefir.pool(),
        writable: false
      }
    });
  }
})
  .compose(Pluggable, API)
  .init(function init () {
    this.use(this.ui)
      .use(this.runner);
  });

export default Mocha.refs({Mocha});
