'use strict';

import rc from 'rc-yaml';
import {partial} from 'lodash';
import {readFileSync} from 'graceful-fs';
import {join} from 'path';

const pkg = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json')));

export default partial(rc, pkg.name);
