import is from 'check-more-types';
import {
  isMap, isSet, isFunction, isNull, isError, isFinite, constant, identity
} from 'lodash';
import {Observable} from '../ext/kefir';

is.mixin(function isSingularArray (value) {
  return Array.isArray(value) && value.length === 1;
}, 'singularArray');

is.mixin(isMap, 'map');
is.mixin(isSet, 'set');
is.mixin(isFunction, 'function');
is.mixin(isNull, 'null');
is.mixin(isError, 'error');
is.mixin(isFinite, 'finite');
is.mixin(constant(true), 'any');

Observable.prototype.reject = function reject (func = identity) {
  return this.withHandler((emitter, event) => {
    if (event.type === 'value') {
      if (!func(event.value)) {
        emitter.emit(event.value);
      }
      return;
    }
    emitter.emitEvent(event);
  });
};

Observable.prototype.shortLog = function shortLog () {
  const name = this.toString();
  return this.withHandler((emitter, event) => {
    if (event.type === 'end') {
      console.log(name, '<end>');
    } else {
      console.log(name, `<${event.type}>`, String(event.value));
    }
    emitter.emitEvent(event);
  });
};
