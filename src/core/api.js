import stampit from 'stampit';
import {defaults} from 'lodash/fp';

const API = stampit({
  methods: {
    createAPI (API = stampit(), properties = {}) {
      return API(defaults({
        delegate: this
      }, properties));
    }
  }
});

export default API;
