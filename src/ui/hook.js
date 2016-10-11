import stampit from '../ext/stampit';
import {constant} from '../ext/kefir';

const Hook = stampit({
  methods: {
    attach (parent) {
      this.parent = parent;
      return constant(this);
    },
    run () {
      return this.execute();
    }
  }
});

export default Hook;
