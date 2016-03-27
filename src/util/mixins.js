import is from 'check-more-types';
import _ from 'lodash';

is.mixin(_.isFunction, 'function');

is.mixin(_.isNull, 'null');

is.mixin(_.isError, 'error');

is.mixin(function isArrayOfUnemptyStrings (value) {
  return is.arrayOf(is.unemptyString, value);
}, 'arrayOfUnemptyStrings');
