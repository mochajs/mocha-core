import {DepGraph} from 'dependency-graph';
import _ from 'lodash';
import Graphable from '../../../src/core/graphable';

describe('core/graphable', () => {
  describe('Graphable()', () => {
    it('should mimic a DepGraph', () => {
      const graph = Graphable();
      expect(_.functionsIn(graph))
        .to
        .eql(_.functions(DepGraph.prototype));
    });
  });
});
