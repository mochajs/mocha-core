import stampit from 'stampit';
import {Kefir} from 'kefir';

// needs to be composed with an EventEmitter, probably
const Streamable = stampit({
  methods: {
    eventStream (event) {
      return Kefir.fromEvents(this, event);
    }
  }
});

export default Streamable;

