import is from 'check-more-types';
import _ from 'lodash';

function isPositiveNumber (value) {
  return _.isNumber(value) && value > 0;
}

function isSingularArray (value) {
  return Array.isArray(value) && value.length === 1;
}

function isArrayOfUnemptyStrings (value) {
  return is.arrayOf(is.unemptyString, value);
}

is.mixin(_.isFunction, 'function');

is.mixin(_.isNull, 'null');

is.mixin(_.isError, 'error');

is.mixin(_.isFinite, 'finite');

is.mixin(isPositiveNumber, 'positiveNumber');

is.mixin(isSingularArray, 'singularArray');

is.mixin(isArrayOfUnemptyStrings, 'arrayOfUnemptyStrings');
