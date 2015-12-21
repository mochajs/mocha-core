'use strict';

const extend = require('lodash/object/extend');
const isString = require('lodash/lang/isString');
const isUndefined = require('lodash/lang/isUndefined');

const errors = new Map();

/**
 * Creates an `Error` "subclass".  Given a name and one or more objects to mix
 * in create a factory function which returns a new instance of `Error` with
 * the
 * name you chose, and any extra stuff.
 *
 * The factory function accepts *n* parameters; the first is an (optional)
 * string message, and everything else will be mixed in to the resulting error
 * object.
 *
 * The factory function does NOT throw errors.  That's your job.
 *
 * You can use the `new` keyword with the factory function, but it's useless.
 *
 * This function is memoized (at least on the name), so calling it a second
 * time with a previously-"registered" custom error name will return the factory
 * function.
 *
 * (There's absolutely no point in subclassing `Error`.  Anything you can do
 * with a subclass of `Error`, you can do with this function and the returned
 * factory function.)
 *
 * Aside: As an ex-Java programmer, I jumped at the chance to name this
 * function.
 *
 * @param {string} name The name of the new Error "subclass"
 * @param {...Object} [protos] These objects will be mixed in to any Error
 * created by your factory function.
 * @returns {Function} A factory function.
 * @example
 * require('/path/to/this/module')('MyError', {
 *   foo() {
 *     return this.bar;
 *   }
 * });
 * // in some other module...
 * const MyError = require('/path/to/this/module')('MyError');
 * try {
 *   throw MyError('u2', {bar: 'baz'});
 * } catch (e) {
 *   assert.equals(e.foo(), 'baz'); // true
 *   assert.equals(e.name, 'MyError'); // true
 * }
 */
function errorFactoryFactory(name, ...protos) {
  if (!errors.has(name)) {
    errors.set(name, function(msg, ...extra) {
      let err;
      if (isString(msg)) {
        err = new Error(msg);
      } else {
        if (!isUndefined(msg)) {
          extra.unshift(msg);
        }
        err = new Error();
      }
      err.name = name;
      return extend(err, ...protos, ...extra);
    });
  }
  return errors.get(name);
}

/**
 * If you want the `Map` where we store the errors, here it is.
 * @type {Map}
 */
errorFactoryFactory.errors = errors;

module.exports = errorFactoryFactory;
