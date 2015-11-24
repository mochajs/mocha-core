'use strict';

const stampit = require('stampit');
const path = require('path');
const packageName = require('../../package.json').name;

const root = path.join(__dirname, '..', '..');
const delimiter = ':';

const Debuggable = stampit({
  init() {
    const filepath = path.relative(root, module.parent.filename);
    const splitPath = filepath.split(path.sep);
    splitPath.push(splitPath.pop().replace(path.extname(filepath), ''));
    splitPath.unshift(packageName);
    this.debug = require('debug')(splitPath.join(delimiter));
  }
});

module.exports = Debuggable;
