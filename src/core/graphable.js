import stampit from 'stampit';
import {DepGraph} from 'dependency-graph';

const Graphable = stampit.convertConstructor(DepGraph);

export default Graphable;
