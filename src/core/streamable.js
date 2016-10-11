import stampit from '../ext/stampit';
import {constant, pool} from '../ext/kefir';

const Streamable = stampit({
  static: {
    stream$: pool()
  },
  init ({stamp}) {
    stamp.stream$.plug(constant(this));
  }
});

export default Streamable;

