import is from 'check-more-types';
import _ from 'lodash';

is.mixin(function isSingularArray (value) {
  return _.isArray(value) && value.length === 1;
}, 'singularArray');

is.mixin(function isStamp (value) {
  return _.isFunction(value) &&
    value.name ===
    'Factory' &&
    is.object(value.fixed);
}, 'stamp');

is.mixin(function isMoment (value) {
  return is.object(value) && Boolean(value._isAMomentObject);
}, 'moment');

is.mixin(_.isMap, 'map');
is.mixin(_.isSet, 'set');
is.mixin(_.isWeakMap, 'weakMap');
is.mixin(_.isWeakSet, 'weakSet');
is.mixin(_.isFunction, 'function');
is.mixin(_.isNull, 'null');
is.mixin(_.isError, 'error');
is.mixin(_.isFinite, 'finite');
is.mixin(_.constant(true), 'any');
