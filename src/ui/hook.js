import {typed} from '../core';
import Executable from './executable';

const Hook = Executable.compose(typed('Hook'));

export default Hook;
