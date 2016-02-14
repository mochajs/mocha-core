'use strict';

import _ from 'highland';
import {EventEmitter} from 'events';

describe(`highland`, () => {
  it(`should do a thing`, () => {
    const ee = new EventEmitter();
    let s = _('foo', ee);
    let uppercaser = s.fork();
    let reverser = s.fork();

    uppercaser
      .map(value => value.toUpperCase())
      .each(v => console.log(v));
    reverser
      .map(value => value.split('')
        .reverse()
        .join(''))
      .each(v => console.log(v));

    function append (value) {
      ee.emit('foo', value);
    }

    append('foo');
    append('bar');
  });
});
