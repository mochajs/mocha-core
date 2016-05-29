import Suite from '../../../src/ui/suite';
import _ from 'lodash';

describe('ui/suite', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('ui/suite');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('Suite()', () => {
    describe('if created with a function for a title', () => {
      let suite;

      beforeEach(() => {
        suite = Suite({title: _.noop});
      });

      it('should set the "func" prop to the "title"', () => {
        expect(suite)
          .to
          .have
          .property('func', _.noop);
      });

      it('should set the "title" prop to an empty string', () => {
        expect(suite)
          .to
          .have
          .property('title', '');
      });
    });

    it('should return an object with a null "parent" prop', () => {
      expect(Suite().parent).to.be.null;
    });

    it('should return an object with a false "pending" prop', () => {
      expect(Suite().pending).to.be.false;
    });

    it('should return an object with an empty "children" prop', () => {
      const suite = Suite();
      expect(suite.children)
        .to
        .be
        .an('array');
      expect(suite.children).to.be.empty;
    });

    describe('when given a non-falsy "parent" prop', () => {
      let parent;
      let rootSuite;

      beforeEach(() => {
        rootSuite = Suite();
        parent = Suite({parent: rootSuite});
      });

      describe('if parent\'s "pending" prop is true', () => {
        beforeEach(() => {
          parent.pending = true;
        });

        describe('and function is not passed', () => {
          it('should inherit the "pending" prop', () => {
            expect(Suite({parent}).pending).to.be.true;
          });
        });

        describe('and function is passed', () => {
          function func () {
          }

          it('should inherit the "pending" prop', () => {
            expect(Suite({
              parent,
              func
            }).pending).to.be.true;
          });
        });
      });

      describe('if parent\'s "pending" prop is false', () => {
        beforeEach(() => {
          parent.func = function () {
          };
        });

        describe('and function is not passed', () => {
          it('should be pending', () => {
            expect(Suite({parent}).pending).to.be.true;
          });
        });

        describe('and function is passed', () => {
          function func () {
          }

          it('should inherit the "pending" prop', () => {
            expect(Suite({
              parent,
              func
            }).pending).not.to.be.true;
          });
        });
      });
    });

    describe('method', () => {
      let suite;

      beforeEach(() => {
        suite = Suite();
      });

      describe('spawnContext()', () => {
        let value;

        beforeEach(() => {
          value = {};
          sandbox.stub(suite.context, 'spawn')
            .returns(value);
        });

        it('should call the spawn() func of the "context" prop', () => {
          suite.spawnContext();
          expect(suite.context.spawn).to.have.been.calledOnce;
        });

        it('should return the return value of spawn()', () => {
          expect(suite.spawnContext())
            .to
            .equal(value);
        });
      });
    });

    describe('property', () => {
      let suite;
      beforeEach(() => {
        suite = Suite({title: 'foo'});
      });

      describe('pending', () => {
        describe('getter', () => {
          describe('when the Suite has no parent', () => {
            it('should be false', () => {
              expect(suite.pending).to.be.false;
            });
          });

          describe('when the Suite has a parent', () => {
            let parent;

            beforeEach(() => {
              parent = Suite();
              suite.parent = parent;
            });

            describe('and the parent is pending', () => {
              beforeEach(() => {
                parent.pending = true;
              });

              it('should be true', () => {
                expect(suite.pending).to.be.true;
              });
            });

            describe('and the parent is not pending', () => {
              describe('and the Suite has no function', () => {
                it('should be true', () => {
                  expect(suite.pending).to.be.true;
                });
              });

              describe('and the Suite has a function', () => {
                beforeEach(() => {
                  suite.func = _.noop;
                });

                it('should be false', () => {
                  expect(suite.pending).to.be.false;
                });
              });
            });
          });
        });

        describe('setter', () => {
          describe('when the Suite has no parent', () => {
            it('should have no effect', () => {
              suite.pending = true;
              expect(suite.pending).to.be.false;
            });
          });

          describe('when the Suite has a parent', () => {
            let parent;

            beforeEach(() => {
              parent = Suite();
              suite.parent = parent;
            });

            describe('and the Suite has no initial function', () => {
              describe('and the value is falsy', () => {
                beforeEach(() => {
                  suite.pending = false;
                });

                it('should have a "true" pending value', () => {
                  expect(suite.pending).to.be.true;
                });

                it('should have a null function', () => {
                  expect(suite.func).to.be.null;
                });
              });
            });
          });
        });
      });

      describe('fullTitle', () => {
        describe('getter', () => {
          describe('when the Suite has no parent', () => {
            it('should return the title as a single-item array', () => {
              expect(suite.fullTitle)
                .to
                .eql([suite.title]);
            });
          });

          describe('when the Suite has a parent', () => {
            let parent;
            let stub;

            beforeEach(() => {
              parent = Suite();
              suite.parent = parent;
              stub = sandbox.stub()
                .returns(['bar']);
              Object.defineProperty(suite.parent, 'fullTitle', {
                get: stub
              });
            });

            it('should concatenate the titles', () => {
              expect(suite.fullTitle)
                .to
                .eql([
                  'bar',
                  'foo'
                ]);
            });

            it('should ask the parent Suite for its fulltitle', () => {
              suite.fullTitle;
              expect(stub).to.have.been.calledOnce;
            });
          });
        });

        describe('setter', () => {
          it('should throw a TypeError', () => {
            expect(() => suite.fullTitle = 'blah')
              .to
              .throw(TypeError);
          });
        });
      });
    });
  });
});
