'use strict';

function bddInterface(mocha) {
  const BDD = mocha.ui.UI.aliases({
    describe: 'suite',
    context: 'suite',
    it: 'test',
    specify: 'test'
  });

  mocha.ui.add('bdd', BDD);
}

bddInterface.attributes = {
  name: 'mocha-ui-bdd'
};

module.exports = bddInterface;
