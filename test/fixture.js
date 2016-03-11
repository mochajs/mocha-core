'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import chaiEventEmitter from 'chai-eventemitter';
import 'source-map-support/register';
import 'trace';
import 'clarify';
import '../src/util/mixins';

Error.stackTraceLimit = Infinity;

global.expect = chai.expect;
global.sinon = sinon;

chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(chaiEventEmitter);
