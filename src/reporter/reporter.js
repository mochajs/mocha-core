import stampit from 'stampit';

const Reporter = stampit({
  init () {
    const suiteResults = this.results
      .filter(value => value.suite);

    // preliminary failures of suites, _before_ test runs
    suiteResults.filter(({result}) => result.error || result.failure).log();
  }
});

export default Reporter;
