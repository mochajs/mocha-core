# Mocha

## Plugin Architecture

Mocha is built around plugins.  Mocha's programmatic API supplies methods to expose new functionality or modify existing functionality.

If you are familiar with [Hapi](http://hapijs.com), a Mocha plugin looks very similar.  A Mocha plugin is simply a module which exports a function.  In addition, module must export an `attributes` property, which is an object having a `name` property (at minimum).

A plugin may depend on other plugins.  In the `attributes` object, providing a `String` or `Array` `dependencies` property, with the name of one or more plugin dependencies, will ensure those dependencies are loaded first.

A plugin's function is called with two parameters: an API object, and an object of options to the plugin (if supplied).  This function will either return a `Promise` or be synchronous.

The API object will supply methods to help the plugin do whatever it needs to do.

