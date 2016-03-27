import stampit from 'stampit';
import {Mappable, Singleton} from '../core';

const OptionMap = stampit({
  static: {
    option (opts) {

    }
  },
  refs: {
    options: Mappable()
  },
  methods: {
    add (opts) {

    }
  }
})
  .compose(Singleton);

export default OptionMap;
