'use strict';

describe(`core/api`, () => {
  const API = require('../../../src/core/api');
  const Plugin = require('../../../src/core/plugin');

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/api');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`API()`, () => {
    it(`should return an object`, () => {
      expect(API())
        .to
        .be
        .an('object');
    });

    it(`should return an object with a "plugins" Map`, () => {
      expect(API().plugins)
        .to
        .be
        .a('Map');
    });

    describe(`method`, () => {
      let api;
      let plugin;
      let attributes;

      function makePlugin(attrs) {
        function plugin() {
        }

        plugin.attributes = attrs;
        return plugin;
      }

      beforeEach(() => {
        api = API();
        plugin = makePlugin({name: 'foo'});
        attributes = plugin.attributes;
      });

      describe(`use()`, () => {
        function stubInstall() {
          sandbox.stub(Plugin.fixed.methods, 'install', function() {
            this.emit('did-install');
          });
          sandbox.stub(Plugin.fixed.methods, 'installWhenReady');
        }

        it(`should keep the plugin in its "plugins" Map`, () => {
          api.use(plugin);
          expect(api.plugins.get(attributes.name))
            .to
            .be
            .an('object');
        });

        it(`should normalize the plugin attributes`, () => {
          sandbox.spy(API, 'normalizeAttributes');
          api.use(plugin);
          expect(API.normalizeAttributes)
            .to
            .have
            .been
            .calledWithExactly(attributes);
        });

        it(`should return the instance`, () => {
          expect(api.use(plugin))
            .to
            .equal(api);
        });

        describe(`if the plugin has no dependencies`, () => {
          beforeEach(stubInstall);
          it(`should install`, () => {
            api.use(plugin);
            expect(Plugin.fixed.methods.install).to.have.been.calledOnce;
          });

          it(`should emit "did-install"`, () => {
            expect(() => api.use(plugin))
              .to
              .emitFrom(api, `did-install:${attributes.name}`);
          });
        });

        describe(`if a plugin's dependencies are installed`, () => {
          beforeEach(() => {
            const dep = makePlugin({name: 'dep'});

            api.use(dep);
            attributes.dependencies =
              ['dep'].concat(attributes.dependencies || []);

            stubInstall();
          });

          it(`should install`, () => {
            api.use(plugin);
            expect(Plugin.fixed.methods.install).to.have.been.calledOnce;
          });
        });

        describe(`if a plugin's dependencies are not installed`, () => {
          beforeEach(() => {
            attributes.dependencies =
              ['dep'].concat(attributes.dependencies || []);

            stubInstall();
          });

          it(`should install when ready`, () => {
            api.use(plugin);
            expect(Plugin.fixed.methods.install).not.to.have.been.called;
            expect(Plugin.fixed.methods.installWhenReady)
              .to
              .have
              .been
              .calledWithExactly(['dep']);
          });
        });

        describe(`if the plugin is not usable`, () => {
          beforeEach(() => {
            sandbox.stub(api.plugins, 'isUsable')
              .returns(false);
          });

          it(`should throw`, () => {
            expect(() => api.use(plugin))
              .to
              .throw(Error, /multiple/i);
          });
        });
      });

      describe(`spawn()`, () => {
        it(`should return a new API factory`, () => {
          expect(api.spawn())
            .not
            .to
            .equal(API);
        });

        it(`should return an API factory creating an object with the same depGraph`,
          () => {
            expect(api.spawn()().depGraph)
              .to
              .equal(api.depGraph);
          });

        it(`should accept an API parameter`, () => {
          const FooAPI = API.methods({
            foo() {
            }
          });
          expect(api.spawn(FooAPI)().foo)
            .to
            .be
            .a('function');
        });
      });
    });

    describe(`static`, () => {
      describe(`method`, () => {
        describe(`normalizeAttributes()`, () => {
          it(`should return a clone of the object`, () => {
            const attrs = {};
            expect(API.normalizeAttributes(attrs))
              .not
              .to
              .eql(attrs);
          });

          it(`should populate prop "dependencies" as an array`, () => {
            expect(API.normalizeAttributes({}).dependencies)
              .to
              .eql([]);
          });

          it(`should convert string "dependencies" to an array`, () => {
            expect(API.normalizeAttributes({dependencies: 'foo'}).dependencies)
              .to
              .eql(['foo']);
          });

          describe(`if property "pkg" is present`, () => {
            it(`should pull property "name"`, () => {
              expect(API.normalizeAttributes({pkg: {name: 'foo'}}).name)
                .to
                .eql('foo');
            });

            it(`should pull property "description"`, () => {
              expect(API.normalizeAttributes({pkg: {description: 'foo'}}).description)
                .to
                .eql('foo');
            });

            it(`should pull property "version"`, () => {
              expect(API.normalizeAttributes({pkg: {version: 'foo'}}).version)
                .to
                .eql('foo');
            });

            describe(`if "name" is already present`, () => {
              it(`should not overwrite it`, () => {
                expect(API.normalizeAttributes({
                  name: 'foo',
                  pkg: {name: 'bar'}
                }).name)
                  .to
                  .eql('foo');
              });
            });

            describe(`if "description" is already present`, () => {
              it(`should not overwrite it`, () => {
                expect(API.normalizeAttributes({
                  description: 'foo',
                  pkg: {description: 'bar'}
                }).description)
                  .to
                  .eql('foo');
              });
            });

            describe(`if "version" is already present`, () => {
              it(`should not overwrite it`, () => {
                expect(API.normalizeAttributes({
                  version: 'foo',
                  pkg: {version: 'bar'}
                }).version)
                  .to
                  .eql('foo');
              });
            });
          });
        });
      });
    });
  });
});
