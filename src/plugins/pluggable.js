'use strict';

import stampit from 'stampit';
import Plugin from './plugin';
import PluginMap from './plugin-map';
import {Graphable, EventEmittable} from '../core/base';
import {assign, isString, defaults, isFunction} from 'lodash';
import Attributes from './attributes';
import resolveDep from 'resolve-dep';
import loader from './loader';

const Pluggable = stampit({
  refs: {
    Plugin,
    pluginMap: PluginMap(),
    depGraph: Graphable(),
    resolverOptions: {}
  },
  methods: {
    resolve(pattern, options = {}) {
      let retval;
      if (isString(pattern)) {
        const opts = defaults(options, this.resolverOpts, {
          prefixes: []
        });
        const result = resolveDep([
          pattern,
          opts.prefixes.concat(opts.prefixes || [])
            .concat(pattern)
            .join('-')
        ]);
        retval = loader(result);
      } else if (isFunction(pattern)) {
        retval = pattern;
      }

      return retval;
    },
    use(pattern, opts = {}, resolverOpts = {}) {
      const func = this.resolve(pattern, resolverOpts);
      if (!func) {
        throw new Error(`could not resolve plugin given "${pattern}"`);
      }
      const attrs = Attributes(func.attributes);
      const {name} = attrs;
      const pluginMap = this.pluginMap;
      const depGraph = this.depGraph;

      if (!pluginMap.isUsable(name)) {
        throw new Error(`Plugin "${name}" is already loaded`);
      }

      const instance = assign({}, attrs, {
        func,
        opts,
        depGraph,
        api: this
      });

      const plugin = this.Plugin(instance)
        .once('installed', () => this.emit(`did-install:${name}`));

      pluginMap.set(name, plugin);
      plugin.install(pluginMap.missingDeps(name));

      return this;
    }
  }
})
  .compose(EventEmittable);

export default Pluggable;
