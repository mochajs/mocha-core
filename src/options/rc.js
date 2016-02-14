'use strict';

import rc from 'rc-yaml';
import {partial} from 'lodash';
import pkg from './package';

export default partial(rc, pkg.name);
