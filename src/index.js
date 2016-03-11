'use strict';

/**
 * Mocha's main entry point.  Loads shims/globals (async-listener/zone.js
 * depending on context)
 * @module index
 * @see https://www.npmjs.com/package/source-map-support
 * @see https://www.npmjs.com/package/async-listener
 * @see https://www.npmjs.com/package/zone.js
 */

import 'source-map-support/register';
import 'babel-polyfill';
import Mocha from './mocha';
import pkg from './options/package';
import './util/mixins';

/**
 * Default instance of Mocha.  It doesn't *need* to be used by consumers, but
 * exists for the sake of convenience.
 * @type {Mocha}
 */
export const mocha = Mocha();

export const version = pkg.version;
