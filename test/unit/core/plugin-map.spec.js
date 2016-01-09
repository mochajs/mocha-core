'use strict';

import PluginMap from '$src/core/plugin-map';

const MAP = global.Map ? 'Map' : 'Object';

describe(`core/plugin-map`, () => {
  describe(`PluginMap()`, () => {
    it(`should return a Map`, () => {
      expect(PluginMap())
        .to
        .be
        .a(MAP);
    });

    describe(`method`, () => {
      let map;

      beforeEach(() => {
        map = PluginMap();
      });

      describe(`isInstalled()`, () => {
        it(`should return a boolean`, () => {
          expect(map.isInstalled())
            .to
            .be
            .a('boolean');
        });

        describe(`if the key is not present`, () => {
          it(`should return false`, () => {
            expect(map.isInstalled('foo')).to.be.false;
          });
        });

        describe(`if the key is present`, () => {
          describe(`and the value does not have a truthy "installed" prop`,
            () => {
              it(`should return false`, () => {
                map.set('foo', {});
                expect(map.isInstalled('foo')).to.be.false;
              });
            });

          describe(`and the value has a truthy "installed" prop`, () => {
            it(`should return true`, () => {
              map.set('foo', {installed: true});
              expect(map.isInstalled('foo')).to.be.true;
            });
          });
        });
      });

      describe(`isInstallable()`, () => {
        it(`should return a boolean`, () => {
          expect(map.isInstallable()).to.be.a('boolean');
        });

        describe(`if the key is not present`, () => {
          it(`should return false`, () => {
            expect(map.isInstallable('foo')).to.be.false;
          });
        });

        describe(`if the key is present`, () => {
          describe(`and the value is installed`, () => {
            it(`should return false`, () => {
              map.set('foo', {installed: true});
              expect(map.isInstallable('foo')).to.be.false;
            });
          });

          describe(`and the value is not installed`, () => {
            describe(`and the value has no dependencies`, () => {
              it(`should return true`, () => {
                map.set('foo', {});
                expect(map.isInstallable('foo')).to.be.true;
              });
            });

            describe(`and the value has dependencies`, () => {
              describe(`and the dependencies are not installed`, () => {
                it(`should return false`, () => {
                  map.set('foo', {dependencies: ['bar']});
                  map.set('bar', {});
                  expect(map.isInstallable('foo')).to.be.false;
                });
              });

              describe(`and the dependencies are installed`, () => {
                it(`should return true`, () => {
                  map.set('foo', {dependencies: ['bar']});
                  map.set('bar', {installed: true});
                  expect(map.isInstallable('foo')).to.be.true;
                });
              });
            });
          });
        });
      });

      describe(`isUsable()`, () => {
        it(`should return a boolean`, () => {
          expect(map.isUsable()).to.be.a('boolean');
        });

        describe(`if the plugin already exists`, () => {
          beforeEach(() => {
            map.set('foo', {});
          });

          it(`should return false`, () => {
            expect(map.isUsable('foo')).to.be.false;
          });
        });

        describe(`if the plugin does not exist`, () => {
          it(`should return true`, () => {
            expect(map.isUsable('foo')).to.be.true;
          });
        });
      });
    });
  });
});
