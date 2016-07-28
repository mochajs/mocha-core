/* eslint-disable strict */

'use strict';

exports.scripts = {
  default: 'p-s build',
  clean: 'rimraf lib/',
  build: {
    default: 'p-s clean && p-s build.node',
    node: 'BABEL_ENV=node babel --out-dir=lib/ src/'
  },
  lint: 'eslint src/ test/ .*.js',
  test: {
    default: 'p-s -p lint, nsp, test.node, test.browser',
    browser: 'karma start .karma.conf.js --single-run',
    node: 'nyc --require babel-register mocha --colors --require ./test/fixture --recursive',
    quick: 'mocha --require babel-register --colors --require ./test/fixture --recursive'
  },
  nsp: 'nsp check',
  update: 'updtr -t "npm start test.quick"',
  bump: {
    default: 'p-s bump.patch',
    patch: 'npm version patch -m "Release v%s"',
    minor: 'npm version minor -m "Release v%s"',
    major: 'npm version major -m "Release v%s"',
  }
};
