import {Taggable} from '../core';
import Executable from './executable';

const Test = Executable.compose(Taggable)
  .static({
    create (parent, definition, opts) {
      return this.refs({parent, opts})
        .enclose(definition);
    }
  })
  .methods({
    toString () {
      return `<Test "${this.title}">`;
    }
  });

export default Test;
