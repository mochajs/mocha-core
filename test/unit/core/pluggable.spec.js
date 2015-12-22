'use strict';

describe(`core/pluggable`, () => {
  const Pluggable = require('../../../src/core/pluggable');
  const Plugin = require('../../../src/core/plugin');

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create('core/pluggable');
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe(`Pluggable()`, () => {
    it(`should return an object`, () => {
      expect(Pluggable())
        .to
        .be
        .an('object');
    });

    it(`should return an object with a "plugins" Map`, () => {
      expect(Pluggable().plugins)
        .to
        .be
        .a('Map');
    });

    describe(`method`, () => {
      let pluggable;
      let plugin;
      let attributes;

      function makePlugin(attrs) {
        function plugin() {
        }

        plugin.attributes = attrs;
        return plugin;
      }

      beforeEach(() => {
        pluggable = Pluggable();
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
          pluggable.use(plugin);
          expect(pluggable.plugins.get(attributes.name))
            .to
            .be
            .an('object');
        });

        it(`should normalize the plugin attributes`, () => {
          sandbox.spy(Pluggable, 'normalizeAttributes');
          pluggable.use(plugin);
          expect(Pluggable.normalizeAttributes)
            .to
            .have
            .been
            .calledWithExactly(attributes);
        });

        it(`should return the instance`, () => {
          expect(pluggable.use(plugin))
            .to
            .equal(pluggable);
        });

        describe(`if the plugin has no dependencies`, () => {
          beforeEach(stubInstall);
          it(`should install`, () => {
            pluggable.use(plugin);
            expect(Plugin.fixed.methods.install).to.have.been.calledOnce;
          });

          it(`should emit "did-install"`, () => {
            expect(() => pluggable.use(plugin))
              .to
              .emitFrom(pluggable, `did-install:${attributes.name}`);
          });
        });

        describe(`if a plugin's dependencies are installed`, () => {
          beforeEach(() => {
            const dep = makePlugin({name: 'dep'});

            pluggable.use(dep);
            attributes.dependencies =
              ['dep'].concat(attributes.dependencies || []);

            stubInstall();
          });

          it(`should install`, () => {
            pluggable.use(plugin);
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
            pluggable.use(plugin);
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
            sandbox.stub(pluggable.plugins, 'isUsable')
              .returns(false);
          });

          it(`should throw`, () => {
            expect(() => pluggable.use(plugin))
              .to
              .throw(Error, /multiple/i);
          });
        });
      });
    });

    describe(`static`, () => {
      describe(`method`, () => {
        describe(`normalizeAttributes()`, () => {
          it(`should return a clone of the object`, () => {
            const attrs = {};
            expect(Pluggable.normalizeAttributes(attrs))
              .not
              .to
              .eql(attrs);
          });

          it(`should populate prop "dependencies" as an array`, () => {
            expect(Pluggable.normalizeAttributes({}).dependencies)
              .to
              .eql([]);
          });

          it(`should convert string "dependencies" to an array`, () => {
            expect(Pluggable.normalizeAttributes({dependencies: 'foo'}).dependencies)
              .to
              .eql(['foo']);
          });

          describe(`if property "pkg" is present`, () => {
            it(`should pull property "name"`, () => {
              expect(Pluggable.normalizeAttributes({pkg: {name: 'foo'}}).name)
                .to
                .eql('foo');
            });

            it(`should pull property "description"`, () => {
              expect(Pluggable.normalizeAttributes({pkg: {description: 'foo'}}).description)
                .to
                .eql('foo');
            });

            it(`should pull property "version"`, () => {
              expect(Pluggable.normalizeAttributes({pkg: {version: 'foo'}}).version)
                .to
                .eql('foo');
            });

            describe(`if "name" is already present`, () => {
              it(`should not overwrite it`, () => {
                expect(Pluggable.normalizeAttributes({
                  name: 'foo',
                  pkg: {name: 'bar'}
                }).name)
                  .to
                  .eql('foo');
              });
            });

            describe(`if "description" is already present`, () => {
              it(`should not overwrite it`, () => {
                expect(Pluggable.normalizeAttributes({
                  description: 'foo',
                  pkg: {description: 'bar'}
                }).description)
                  .to
                  .eql('foo');
              });
            });

            describe(`if "version" is already present`, () => {
              it(`should not overwrite it`, () => {
                expect(Pluggable.normalizeAttributes({
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
