'use strict';

var slinker = require('slinker');
var path = require('path');
var rootPath = path.join(__dirname, '..');

slinker.link({
  modules: ['src'],
  modulesBasePath: rootPath,
  symlinkPrefix: '$',
  nodeModulesPath: path.join(rootPath, 'node_modules')
});
