'use strict';

import 'source-map-support/register';
import 'trace';
import 'clarify';

Error.stackTraceLimit = Infinity;

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import chaiEventEmitter from 'chai-eventemitter';

global.expect = chai.expect;
global.sinon = sinon;

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiEventEmitter);
