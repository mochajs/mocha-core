import stampit from 'stampit';
import {Unique} from '../core';

const Context = stampit({
  props: {
    root: false,
    executable: {}
  },
  methods: {
    retries (num = 0) {
      this.executable.retries = Number(num) || 0;
    },
    withExecutable (executable) {
      this.executable = executable;
      return this;
    },
    spawn () {
      return this.Factory(this);
    }
  },
  init ({stamp}) {
    this.Factory = stamp;
  }
}).compose(Unique);

export default Context;

