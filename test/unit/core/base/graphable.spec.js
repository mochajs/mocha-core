'use strict';

import {DepGraph} from 'dependency-graph';
import _ from 'lodash';
import Graphable from '../../../../src/core/base/graphable';

describe(`core/base/graphable`, () => {
  describe(`Graphable()`, () => {
    it(`should mimic a DepGraph`, () => {
      const graph = Graphable();
      expect(_.functions(graph))
        .to
        .eql(_.functions(DepGraph.prototype));
    });
  });
});
