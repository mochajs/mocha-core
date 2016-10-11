import stampit from '../ext/stampit';

const Reporter = stampit({
  init () {
    this.runner.on('suite', suite => {
      console.log(`${suite} begin`);
    });

    this.runner.on('suiteEnd', suite => {
      console.log(`${suite} end`);
    });

    this.runner.on('test', test => {
      console.log(`${test} begin`);
    });

    this.runner.on('testEnd', test => {
      console.log(`${test} end`);
    });
  }
});

export default Reporter;
