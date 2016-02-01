'use strict';

export default function loader(moduleName) {
  return global[moduleName];
}
