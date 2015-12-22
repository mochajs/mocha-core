'use strict';

const {DepGraph} = require('dependency-graph');
const _ = require('lodash');

describe(`core/base/graphable`, () => {
  const Graphable = require('../../../../src/core/base/graphable');

  describe(`Graphable()`, () => {
    it(`should mimic a DepGraph`, () => {
      const graph = Graphable();
      expect(_.functions(graph))
        .to
        .eql(_.functions(DepGraph.prototype));
    });
  });
});
