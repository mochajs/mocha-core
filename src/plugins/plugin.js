import stampit from 'stampit';
import {merge} from 'lodash/fp';

const Plugin = stampit({
  props: {
    installed: false
  },
  methods: {
    install (opts = {}) {
      this.func(this.api, merge(this.opts), opts);
      this.installed = true;
      return this;
    }
  }
});

export default Plugin;
