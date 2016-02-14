'use strict';

import _ from 'lodash';
import FSM from '../../../../src/core/fsm';

describe(`core/base/fsm`, () => {
  describe(`FSM()`, () => {
    it(`should throw if no initial state declared`, () => {
      expect(FSM)
        .to
        .throw(Error, /initial/);
    });

    it(`should return an object`, () => {
      expect(FSM({state: 'foo'}))
        .to
        .be
        .an('object');
    });

    describe(`static method`, () => {
      describe(`initialState()`, () => {
        it(`should set the initial state of the FSM`, () => {
          const stamp = FSM.initialState('start');
          expect(stamp.fixed.props.state)
            .to
            .equal('start');
        });
      });

      describe(`state()`, () => {
        let stamp;

        beforeEach(() => {
          stamp = FSM.state('start', {go: 'done'});
        });

        it(`should add a state to the state map`, () => {
          expect(stamp.fixed.props.states['start']['go'])
            .to
            .equal('done');
        });

        it(`should use a clone of the "states" ref`, () => {
          expect(stamp.fixed.props.states)
            .not
            .to
            .equal(FSM.fixed.props.states);
        });

        it(`should create an "action" method`, () => {
          expect(stamp.fixed.methods.go).to.be.a('function');
        });
      });

      describe(`states()`, () => {
        let stamp;
        let states;

        beforeEach(() => {
          states = {
            start: {
              go: 'done'
            },
            done: {
              finish: 'reallyDone'
            },
            reallyDone: {}
          };
          stamp = FSM.states(states);
        });

        it(`should add all states to the state map`, () => {
          _.forEach(states, (value, key) => {
            expect(stamp.fixed.props.states)
              .to
              .include
              .key(key);
            _.forEach(stamp.fixed.props.states[key], (toState, action) => {
              expect([
                action,
                toState
              ])
                .to
                .eql(_.toPairs(value)[0]);
            });
          });
        });

        it(`should use a clone of the "states" ref`, () => {
          expect(stamp.fixed.props.states)
            .not
            .to
            .equal(FSM.fixed.props.states);
        });
      });
    });

    describe(`method`, () => {
      let states;
      let fsm;

      beforeEach(() => {
        states = {
          start: {
            go: 'done'
          },
          done: {
            finish: 'reallyDone'
          },
          reallyDone: {}
        };
        fsm = FSM.states(states)
          .initialState('start')();
      });

      describe(`emit()`, () => {
        describe(`when an unknown event is emitted`, () => {
          it(`should pass through`, () => {
            expect(() => fsm.emit('foo', 'bar'))
              .to
              .emitFrom(fsm, 'foo', 'bar');
          });

          it(`should leave the state the same`, () => {
            expect(fsm.state)
              .to
              .equal('start');
          });
        });

        describe(`when an action is executed`, () => {
          it(`should emit the next state`, () => {
            expect(() => fsm.go())
              .to
              .emitFrom(fsm, 'done');
          });

          it(`should set the next state`, () => {
            fsm.go();
            expect(fsm.state)
              .to
              .equal('done');
          });
        });
      });
    });
  });
});
