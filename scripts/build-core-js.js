/* eslint strict: off */

const path = require('path');
const writeFile = require('bluebird')
  .promisify(require('fs').writeFile);

require('core-js-builder')({
  modules: [
    'es6.map',
    'es6.promise',
    'es6.set',
    'es6.array.from',
    'web.immediate'
  ],
  library: true
})
  .then(code => writeFile(
    path.join(__dirname, '..', 'vendor', 'core-js.js'), code, 'utf-8'));
