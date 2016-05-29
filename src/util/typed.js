import './mixins';
import stampit from 'stampit';
import is from 'check-more-types';
import {camelCase, forEach, mapValues, assign} from 'lodash';

const checks = [
  is.stamp,
  is.array,
  is.map,
  is.weakMap,
  is.set,
  is.weakSet,
  is.date,
  is.moment,
  is.object,
  is.string,
  is.number,
  is.bool
];

/**
 * Given a name and a Stamp definition, mixin a *schema* for the Stamp
 * into the `check-more-types` module, so we can make assertions about objects.
 * @param {string} stampName The "name" or "type" of this Stamp
 * @param {Object} [def={}] Stamp definition (as passed to `stampit()`)
 * @returns {Function} New Stamp (unaffected by this code)
 */
function typed (stampName, def = {}) {
  const schema = {};
  forEach(def, (value, key) => {
    if (key === 'methods') {
      assign(schema, mapValues(value, () => is.function));
    } else if (key === 'props' || key === 'refs') {
      assign(schema, mapValues(value, prop => {
        if (is.defined(prop)) {
          let retval;
          forEach(checks, check => {
            if (check(prop)) {
              retval = check;
              return false;
            }
          });
          if (retval) {
            return retval;
          }
        }
        return is.any;
      }));
    }
  });

  is.mixin(is.schema.bind(null, schema), camelCase(stampName));
  return stampit(def);
}

export default typed;

