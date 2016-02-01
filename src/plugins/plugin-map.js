'use strict';

import Mappable from './../core/base/mappable';
import _ from 'lodash';

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

export default PluginMap;
