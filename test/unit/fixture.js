'use strict';

const chai = require('chai');

global.expect = chai.expect;
global.sinon = require('sinon');

chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));
chai.use(require('chai-eventemitter'));

