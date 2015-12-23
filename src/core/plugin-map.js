'use strict';

const Mappable = require('./base/mappable');
const _ = require('lodash');

const PluginMap = Mappable.methods({
  isInstalled(name) {
    return this.has(name) && this.get(name).installed;
  },
  isInstallable(name) {
    return !this.isInstalled(name) &&
      _.every(this.get(name).dependencies, dep => this.isInstalled(dep));
  },
  missingDeps(name) {
    return _.reject(this.get(name).dependencies, dep => this.isInstalled(dep));
  },
  isUsable({name, version}) {
    const existingPlugin = this.get(name);
    return !existingPlugin ||
      !existingPlugin.multiple ||
      existingPlugin.version !==
      version;
  }
});

module.exports = PluginMap;
