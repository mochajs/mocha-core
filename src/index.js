import 'source-map-support/register';
import 'babel-polyfill';
import Mocha from './mocha';
import pkg from './options/package';
import './util/mixins';

const mocha = Mocha();
const version = pkg.version;
export {Mocha, version, mocha as default};
