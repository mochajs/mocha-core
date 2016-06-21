import stampit from 'stampit';
import {constant, pool} from 'kefir';

const Streamable = stampit({
  static: {
    stream$: pool()
  },
  init ({stamp}) {
    stamp.stream$.plug(constant(this));
  }
});

export default Streamable;

