'use strict';

import {head} from 'lodash';

export default function loader(modules) {
  try {
    return require(head(modules));
  } catch (ignored) {
    // ignored;
  }
}
