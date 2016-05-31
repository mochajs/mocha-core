import stampit from 'stampit';
import {Pluggable} from './plugins';
import {UI} from './ui';
import {Runner} from './runner';
import {Reporter} from './reporter';
import pkg from './options/package';
import {Kefir} from 'kefir';
import {assign} from 'lodash/fp';
import is from 'check-more-types';
import {Streamable} from './core';

const Mocha = stampit({
  refs: {
    version: pkg.version,
    executable$: Kefir.pool(),
    plugins: {}
  },
  methods: {
    createAPI (Factory, properties = {}) {
      if (is.not.function(Factory)) {
        throw new Error('Factory function required');
      }
      return Factory(assign({
        delegate: this
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
    },
    run () {
      this.emit('mocha:run');
    }
  }
})
  .compose(Pluggable, Streamable)
  .init(function init () {
    this.use(this.ui)
      .use(this.runner);
  });

export default Mocha.refs({Mocha});
