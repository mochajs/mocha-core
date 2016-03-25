'use strict';

import is from 'check-more-types';
import {isFunction, isNull} from 'lodash/fp';

is.mixin(isFunction, 'function');
is.mixin(isNull, 'null');

is.mixin(function isArrayOfUnemptyStrings (value) {
  return is.arrayOf(is.unemptyString, value);
}, 'arrayOfUnemptyStrings');

const isPromise = is.schema({
  then: is.function
});

is.mixin(isPromise, 'promise');
