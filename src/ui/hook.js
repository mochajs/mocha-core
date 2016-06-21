import Executable from './executable';
import stampit from 'stampit';
import camelCase from 'lodash/fp';
import {constant} from 'kefir';

const Hook = stampit({
  static: {
    inits: {
      'pre': hook => {
        hook.parent.pre$.plug(constant(hook));
      },
      'pre-each': hook => {
        hook.parent.pre$.plug(constant(hook));
      },
      'post': hook => {

      },
      'post-each': hook => {

      }
    }
  },
  refs: {
    kind: 'pre-each'
  },
  init ({stamp}) {
    stamp.inits[this.kind](this);
  }
});

export default Hook;
