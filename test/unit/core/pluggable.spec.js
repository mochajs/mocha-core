'use strict';

import Pluggable from '../../../src/core/pluggable';

describe(`core/pluggable`, () => {
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
        beforeEach(() => {
          sandbox.spy(pluggable, 'Plugin');
        });

        it(`should instantiate a Plugin`, () => {
          pluggable.use(plugin);
          expect(pluggable.Plugin)
            .to
            .have
            .been
            .calledWithExactly({
              func: plugin,
              opts: {},
              depGraph: pluggable.depGraph,
              api: pluggable,
              name: 'foo',
              dependencies: []
            });
        });

        it(`should keep the plugin in its "plugins" Map`, () => {
          pluggable.use(plugin);
          expect(pluggable.pluginMap.get(attributes.name))
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

        it(`should install the plugin`, () => {
          pluggable.Plugin = pluggable.Plugin.init(function() {
            this.install = sandbox.stub();
          });
          sandbox.spy(pluggable, 'Plugin');
          pluggable.use(plugin);
          expect(pluggable.Plugin.firstCall.returnValue.install).to.have.been.calledOnce;
        });

        describe(`if the plugin is ready to be installed`, () => {
          it(`should emit "did-install:<name>"`, () => {
            expect(() => pluggable.use(plugin))
              .to
              .emitFrom(pluggable, `did-install:${attributes.name}`);
          });
        });

        describe(`if a plugin is not ready to be installed`, () => {
          beforeEach(() => {
            pluggable.Plugin = pluggable.Plugin.init(function() {
              this.done = sandbox.stub();
            });
          });

          it(`should not emit "did-install"`, () => {
            expect(() => pluggable.use(plugin))
              .not
              .to
              .emitFrom(pluggable, `did-install:${attributes.name}`);
          });
        });

        describe(`if the plugin is not usable`, () => {
          beforeEach(() => {
            sandbox.stub(pluggable.pluginMap, 'isUsable')
              .returns(false);
          });

          it(`should throw`, () => {
            expect(() => pluggable.use(plugin))
              .to
              .throw(Error, /already/);
          });
        });
      });
    });

    describe(`static`, () => {
      describe(`method`, () => {
        describe(`normalizeAttributes()`, () => {
          it(`should not return a clone of the object`, () => {
            const attrs = {};
            expect(Pluggable.normalizeAttributes(attrs))
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
