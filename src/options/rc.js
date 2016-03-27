import rc from 'rc-yaml';
import {partial} from 'lodash/fp';
import pkg from './package';

export default partial(rc, pkg.name);
