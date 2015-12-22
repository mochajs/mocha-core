'use strict';

const Promise = require('bluebird');
const _ = require('lodash');
const EventEmittable = require('../../../src/core/base/eventemittable');
const Graphable = require('../../../src/core/base/graphable');

describe(`core/plugin`, () => {
  const Plugin = require('../../../src/core/plugin');

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/plugin');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Plugin()`, () => {
    it(`should not throw if "dependencies" is a string value`, () => {
      const graph = Graphable();
      graph.addNode('bar');
      expect(() => Plugin({
        name: 'foo',
        func: _.noop,
        dependencies: 'bar',
        api: EventEmittable(),
        depGraph: graph
      }))
        .not
        .to
        .throw();
    });

    it(`should not throw if "dependencies" is an Array value`, () => {
      const graph = Graphable();
      graph.addNode('bar');
      graph.addNode('baz');
      expect(() => Plugin({
        name: 'foo',
        func: _.noop,
        dependencies: [
          'bar',
          'baz'
        ],
        api: EventEmittable(),
        depGraph: graph
      }))
        .not
        .to
        .throw();
    });

    it(`should not throw if no "dependencies" are passed`, () => {
      expect(() => Plugin({
        name: 'foo',
        func: _.noop,
        api: EventEmittable(),
        depGraph: Graphable()
      }))
        .not
        .to
        .throw();
    });

    it(`should throw if a circular dependency is detected`, () => {
      // this is unlikely to happen, but if it does, fail fast
      const graph = Graphable();
      Plugin({
        name: 'foo',
        func: _.noop,
        api: EventEmittable(),
        depGraph: graph,
        dependencies: 'bar'
      });
      expect(() => Plugin({
        name: 'bar',
        func: _.noop,
        api: EventEmittable(),
        depGraph: graph,
        dependencies: 'foo'
      }))
        .to
        .throw(Error, /cyclic/i);
    });

    describe(`member`, () => {
      let plugin;
      let func;
      let api;

      beforeEach(() => {
        func = sandbox.stub()
          .returns(Promise.resolve());
        api = EventEmittable();
        plugin = Plugin({
          name: 'foo',
          func: func,
          api: api,
          depGraph: Graphable(),
          version: '1.0.0'
        });
        plugin.func = func;
      });

      describe(`property`, () => {
        describe(`depGraph`, () => {
          it(`should not be enumerable`, () => {
            _.forEach(plugin, (value, key) => {
              expect(key)
                .not
                .to
                .equal('depGraph');
            });
          });

          it(`should not be writable`, () => {
            expect(() => plugin.depGraph = 'foo')
              .to
              .throw(Error);
          });
        });
      });

      describe(`method`, () => {
        describe(`install()`, () => {
          it(`should return the Plugin instance`, () => {
            expect(plugin.install())
              .to
              .equal(plugin);
          });

          describe(`if not installed`, () => {
            beforeEach(() => {
              plugin.installed = false;
            });

            it(`should install`, () => {
              plugin.func = sandbox.stub();
              plugin.install();
              expect(plugin.func)
                .to
                .have
                .been
                .calledWithExactly(plugin.api, plugin.opts);
            });

            it(`should emit "will-install"`, () => {
              expect(() => plugin.install())
                .to
                .emitFrom(plugin, 'will-install');
            });

            it(`should emit "did install"`, () => {
              expect(() => plugin.install())
                .to
                .emitFrom(plugin, 'did-install');
            });
          });

          describe(`if already installed`, () => {
            beforeEach(() => {
              plugin.installed = true;
            });

            it(`should not install`, () => {
              plugin.func = sandbox.stub();
              plugin.install();
              expect(plugin.func).not.to.have.been.called;
            });

            it(`should emit "already-installed"`, () => {
              expect(() => plugin.install())
                .to
                .emitFrom(plugin, 'already-installed');
            });

            it(`should not emit "will-install"`, () => {
              expect(() => plugin.install())
                .not
                .to
                .emitFrom(plugin, 'will-install');
            });

            it(`should not emit "did install"`, () => {
              expect(() => plugin.install())
                .not
                .to
                .emitFrom(plugin, 'did-install');
            });
          });
        });

        describe(`installWhenReady()`, () => {
          describe(`if called without parameters`, () => {
            it(`should install`, () => {
              sandbox.stub(plugin, 'install');
              plugin.installWhenReady();
              expect(plugin.install).to.have.been.calledOnce;
            });
          });

          it(`should return the plugin instance`, () => {
            expect(plugin.installWhenReady())
              .to
              .equal(plugin);
          });

          describe(`when passed an array of missing deps`, () => {
            let deps;

            beforeEach(() => {
              sandbox.spy(plugin.api, 'once');
              sandbox.stub(plugin, 'install');
              deps = [
                'foo',
                'bar',
                'baz',
                'quux'
              ];
            });

            it(`should subscribe to the API's "did-install" event for each dep`,
              () => {
                plugin.installWhenReady(deps);

                _.forEach(deps, dep => {
                  expect(plugin.api.once)
                    .to
                    .have
                    .been
                    .calledWith(`did-install:${dep}`);
                });
              });

            describe(`once all did-install:<plugin-name> events are emitted`,
              () => {
                describe(`in ascending order`, () => {
                  it(`should install`, () => {
                    plugin.installWhenReady(deps);

                    _.forEach(deps, dep => {
                      plugin.api.emit(`did-install:${dep}`);
                    });

                    expect(plugin.install).to.have.been.calledOnce;
                  });
                });

                describe(`in descending order`, () => {
                  it(`should install`, () => {
                    plugin.installWhenReady(deps);

                    _.forEach(deps.reverse(), dep => {
                      plugin.api.emit(`did-install:${dep}`);
                    });

                    expect(plugin.install).to.have.been.calledOnce;
                  });
                });

                describe(`in random order`, () => {
                  it(`should install`, () => {
                    plugin.installWhenReady(deps);

                    _(deps)
                      .shuffle()
                      .forEach(dep => {
                        plugin.api.emit(`did-install:${dep}`);
                      })
                      .value();

                    expect(plugin.install).to.have.been.calledOnce;
                  });
                });
              });
          });
        });
      });
    });
  });
});
