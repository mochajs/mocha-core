import FSM from '../../../src/core/fsm';

describe('core/fsm', () => {
  describe('FSM()', () => {
    it('should return an object', () => {
      expect(FSM())
        .to
        .be
        .an('object');
    });

    it('should accept custom properties', () => {
      expect(FSM({foo: 'bar'}))
        .to
        .have
        .property('foo', 'bar');
    });

    describe('if no initial state declared', () => {
      it('should begin in state "none"', () => {
        expect(FSM())
          .to
          .have
          .property('current', 'none');
      });
    });

    describe('static method', () => {
      describe('initial()', () => {
        describe('when supplied a nonempty string', () => {
          it('should set the initial state of the FSM', () => {
            expect(FSM.initial('start').fixed.props)
              .to
              .have
              .property('initial', 'start');
          });
        });
      });

      describe('final()', () => {
        describe('when supplied a nonempty string', () => {
          it('should set the final state of the FSM', () => {
            expect(FSM.final('end').fixed.props)
              .to
              .have
              .property('final')
              .which
              .is
              .an('array')
              .of
              .length(1)
              .and
              .includes('end');
          });
        });

        describe('when supplied an array of nonempty strings', () => {
          it('should set the final state of the FSM', () => {
            expect(FSM.final([
              'end',
              'fin'
            ]).fixed.props)
              .to
              .have
              .property('final')
              .which
              .is
              .an('array')
              .of
              .length(2)
              .and
              .includes('end', 'fin');
          });
        });
      });

      describe('event()', () => {
        describe('when supplied a valid event object', () => {
          it('should add an event to the array of events', () => {
            const event = {
              name: 'foo',
              from: 'bar'
            };
            const stamp = FSM.event(event);
            expect(stamp.fixed.props.events)
              .to
              .have
              .length(1)
              .and
              .include(event);
          });

          describe('being an event object with an unempty string "name" prop',
            () => {
              describe('and unempty string "from" prop', () => {
                it('should not throw', () => {
                  expect(() => FSM.event({
                    name: 'foo',
                    from: 'bar'
                  }))
                    .not
                    .to
                    .throw();
                });
              });

              describe('and array of unempty strings "from" prop', () => {
                it('should not throw', () => {
                  expect(() => FSM.event({
                    name: 'foo',
                    from: ['bar']
                  }))
                    .not
                    .to
                    .throw();
                });

                describe('and an unempty string "to" prop', () => {
                  it('should not throw', () => {
                    expect(() => FSM.event({
                      name: 'foo',
                      from: ['bar'],
                      to: 'baz'
                    }))
                      .not
                      .to
                      .throw();
                  });
                });

                describe('and an array of unempty strings "to" prop', () => {
                  describe('and a "condition" function', () => {
                    it('should not throw', () => {
                      expect(() => FSM.event({
                        name: 'foo',
                        from: ['bar'],
                        to: ['baz'],
                        condition () {
                        }
                      }))
                        .not
                        .to
                        .throw(Error);
                    });
                  });
                });
              });
            });
        });
      });

      describe('events()', () => {
        describe('when supplied valid parameters', () => {
          it('should add the event(s) to the array events prop', () => {
            const events = [
              {
                name: 'foo',
                from: 'bar'
              },
              {
                name: 'baz',
                from: 'quux'
              }
            ];
            const stamp = FSM.events(events);
            expect(stamp.fixed.props.events)
              .to
              .eql(events);
          });

          describe('being an array of valid event objects', () => {
            it('should not throw', () => {
              expect(() => FSM.events([
                {
                  name: 'foo',
                  from: 'bar'
                },
                {
                  name: 'baz',
                  from: 'quux'
                }
              ]))
                .not
                .to
                .throw();
            });
          });

          describe('being a series of valid event objects', () => {
            it('should not throw', () => {
              expect(() => FSM.events({
                name: 'foo',
                from: 'bar'
              }, {
                name: 'baz',
                from: 'quux'
              }))
                .not
                .to
                .throw();
            });
          });
        });
      });

      describe('callback()', () => {
        describe('when supplied an unempty string and a function', () => {
          it('should not throw', () => {
            expect(() => FSM.callback('foo', () => {
            }))
              .not
              .to
              .throw();
          });

          it('should assign a property to the "callbacks" ref with key of string and value of function',
            () => {
              const name = 'onfoo';
              const func = () => {
              };
              const stamp = FSM.callback(name, func);
              expect(stamp.fixed.refs.callbacks)
                .to
                .have
                .property(name, func);
            });
        });

        describe('when supplied a name which does not start with "on"', () => {
          it('should prepend "on" to the callback name', () => {
            const name = 'foo';
            const func = () => {
            };
            const stamp = FSM.callback(name, func);
            expect(stamp.fixed.refs.callbacks)
              .to
              .have
              .property('onfoo', func);
          });
        });

        describe('when supplied a name which is camelCased', () => {
          it('should convert the name to lower case', () => {
            const name = 'fooBar';
            const func = () => {
            };
            const stamp = FSM.callback(name, func);
            expect(stamp.fixed.refs.callbacks)
              .to
              .have
              .property('onfoobar', func);
          });
        });
      });

      describe('callbacks()', () => {
        describe('when supplied an object parameter', () => {
          it('should not throw', () => {
            expect(() => FSM.callbacks({}))
              .not
              .to
              .throw();
          });

          it('should assign it to the "callbacks" ref', () => {
            const obj = {
              foo: () => {
              }
            };
            const stamp = FSM.callbacks(obj);
            expect(stamp.fixed.refs.callbacks)
              .to
              .eql(obj);
          });
        });
      });
    });
  });
});
