'use strict';

const Mappable = require('./base/mappable');
const _ = require('lodash');

const PluginMap = Mappable.methods({
  isInstalled(name) {
    return Boolean(this.has(name) && this.get(name).installed);
  },
  isInstallable(name) {
    return Boolean(this.has(name) && !this.get(name).installed &&
      _.every(this.get(name).dependencies, dep => this.isInstalled(dep)));
  },
  missingDeps(name) {
    return _.reject(this.get(name).dependencies, dep => this.isInstalled(dep));
  },
  isUsable(name) {
    return !this.has(name);
  }
});

module.exports = PluginMap;
