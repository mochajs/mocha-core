require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

// Load modules

const Hoek = require('hoek');
const Any = require('./any');
const Cast = require('./cast');
const Ref = require('./ref');
const Errors = require('./errors');


// Declare internals

const internals = {};


internals.Alternatives = function () {

    Any.call(this);
    this._type = 'alternatives';
    this._invalids.remove(null);

    this._inner.matches = [];
};

Hoek.inherits(internals.Alternatives, Any);


internals.Alternatives.prototype._base = function (value, state, options) {

    let errors = [];
    for (let i = 0; i < this._inner.matches.length; ++i) {
        const item = this._inner.matches[i];
        let schema = item.schema;
        if (!schema) {
            const failed = item.is._validate(item.ref(state.parent, options), null, options, state.parent).errors;
            schema = failed ? item.otherwise : item.then;
            if (!schema) {
                continue;
            }
        }

        const result = schema._validate(value, state, options);
        if (!result.errors) {     // Found a valid match
            return result;
        }

        errors = errors.concat(result.errors);
    }

    return { errors: errors.length ? errors : Errors.create('alternatives.base', null, state, options) };
};


internals.Alternatives.prototype.try = function (/* schemas */) {


    const schemas = Hoek.flatten(Array.prototype.slice.call(arguments));
    Hoek.assert(schemas.length, 'Cannot add other alternatives without at least one schema');

    const obj = this.clone();

    for (let i = 0; i < schemas.length; ++i) {
        const cast = Cast.schema(schemas[i]);
        if (cast._refs.length) {
            obj._refs = obj._refs.concat(cast._refs);
        }
        obj._inner.matches.push({ schema: cast });
    }

    return obj;
};


internals.Alternatives.prototype.when = function (ref, options) {

    Hoek.assert(Ref.isRef(ref) || typeof ref === 'string', 'Invalid reference:', ref);
    Hoek.assert(options, 'Missing options');
    Hoek.assert(typeof options === 'object', 'Invalid options');
    Hoek.assert(options.hasOwnProperty('is'), 'Missing "is" directive');
    Hoek.assert(options.then !== undefined || options.otherwise !== undefined, 'options must have at least one of "then" or "otherwise"');

    const obj = this.clone();
    let is = Cast.schema(options.is);

    if (options.is === null || !options.is.isJoi) {

        // Only apply required if this wasn't already a schema, we'll suppose people know what they're doing
        is = is.required();
    }

    const item = {
        ref: Cast.ref(ref),
        is: is,
        then: options.then !== undefined ? Cast.schema(options.then) : undefined,
        otherwise: options.otherwise !== undefined ? Cast.schema(options.otherwise) : undefined
    };

    Ref.push(obj._refs, item.ref);
    obj._refs = obj._refs.concat(item.is._refs);

    if (item.then && item.then._refs) {
        obj._refs = obj._refs.concat(item.then._refs);
    }

    if (item.otherwise && item.otherwise._refs) {
        obj._refs = obj._refs.concat(item.otherwise._refs);
    }

    obj._inner.matches.push(item);

    return obj;
};


internals.Alternatives.prototype.describe = function () {

    const description = Any.prototype.describe.call(this);
    const alternatives = [];
    for (let i = 0; i < this._inner.matches.length; ++i) {
        const item = this._inner.matches[i];
        if (item.schema) {

            // try()

            alternatives.push(item.schema.describe());
        }
        else {

            // when()

            const when = {
                ref: item.ref.toString(),
                is: item.is.describe()
            };

            if (item.then) {
                when.then = item.then.describe();
            }

            if (item.otherwise) {
                when.otherwise = item.otherwise.describe();
            }

            alternatives.push(when);
        }
    }

    description.alternatives = alternatives;
    return description;
};


module.exports = new internals.Alternatives();

},{"./any":2,"./cast":5,"./errors":7,"./ref":12,"hoek":18}],2:[function(require,module,exports){
(function (Buffer){
'use strict';

// Load modules

const Hoek = require('hoek');
const Ref = require('./ref');
const Errors = require('./errors');
let Alternatives = null;                // Delay-loaded to prevent circular dependencies
let Cast = null;


// Declare internals

const internals = {};


internals.defaults = {
    abortEarly: true,
    convert: true,
    allowUnknown: false,
    skipFunctions: false,
    stripUnknown: false,
    language: {},
    presence: 'optional',
    raw: false,
    strip: false,
    noDefaults: false

    // context: null
};


internals.checkOptions = function (options) {

    const optionType = {
        abortEarly: 'boolean',
        convert: 'boolean',
        allowUnknown: 'boolean',
        skipFunctions: 'boolean',
        stripUnknown: 'boolean',
        language: 'object',
        presence: ['string', 'required', 'optional', 'forbidden', 'ignore'],
        raw: 'boolean',
        context: 'object',
        strip: 'boolean',
        noDefaults: 'boolean'
    };

    const keys = Object.keys(options);
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const opt = optionType[key];
        let type = opt;
        let values = null;

        if (Array.isArray(opt)) {
            type = opt[0];
            values = opt.slice(1);
        }

        Hoek.assert(type, 'unknown key ' + key);
        Hoek.assert(typeof options[key] === type, key + ' should be of type ' + type);
        if (values) {
            Hoek.assert(values.indexOf(options[key]) >= 0, key + ' should be one of ' + values.join(', '));
        }
    }
};


module.exports = internals.Any = function () {

    Cast = Cast || require('./cast');

    this.isJoi = true;
    this._type = 'any';
    this._settings = null;
    this._valids = new internals.Set();
    this._invalids = new internals.Set();
    this._tests = [];
    this._refs = [];
    this._flags = { /*
        presence: 'optional',                   // optional, required, forbidden, ignore
        allowOnly: false,
        allowUnknown: undefined,
        default: undefined,
        forbidden: false,
        encoding: undefined,
        insensitive: false,
        trim: false,
        case: undefined,                        // upper, lower
        empty: undefined,
        func: false
    */ };

    this._description = null;
    this._unit = null;
    this._notes = [];
    this._tags = [];
    this._examples = [];
    this._meta = [];

    this._inner = {};                           // Hash of arrays of immutable objects
};


internals.Any.prototype.isImmutable = true;     // Prevents Hoek from deep cloning schema objects


internals.Any.prototype.clone = function () {

    const obj = Object.create(Object.getPrototypeOf(this));

    obj.isJoi = true;
    obj._type = this._type;
    obj._settings = internals.concatSettings(this._settings);
    obj._valids = Hoek.clone(this._valids);
    obj._invalids = Hoek.clone(this._invalids);
    obj._tests = this._tests.slice();
    obj._refs = this._refs.slice();
    obj._flags = Hoek.clone(this._flags);

    obj._description = this._description;
    obj._unit = this._unit;
    obj._notes = this._notes.slice();
    obj._tags = this._tags.slice();
    obj._examples = this._examples.slice();
    obj._meta = this._meta.slice();

    obj._inner = {};
    const inners = Object.keys(this._inner);
    for (let i = 0; i < inners.length; ++i) {
        const key = inners[i];
        obj._inner[key] = this._inner[key] ? this._inner[key].slice() : null;
    }

    return obj;
};


internals.Any.prototype.concat = function (schema) {

    Hoek.assert(schema && schema.isJoi, 'Invalid schema object');
    Hoek.assert(this._type === 'any' || schema._type === 'any' || schema._type === this._type, 'Cannot merge type', this._type, 'with another type:', schema._type);

    let obj = this.clone();

    if (this._type === 'any' && schema._type !== 'any') {

        // Reset values as if we were "this"
        const tmpObj = schema.clone();
        const keysToRestore = ['_settings', '_valids', '_invalids', '_tests', '_refs', '_flags', '_description', '_unit',
            '_notes', '_tags', '_examples', '_meta', '_inner'];

        for (let i = 0; i < keysToRestore.length; ++i) {
            tmpObj[keysToRestore[i]] = obj[keysToRestore[i]];
        }

        obj = tmpObj;
    }

    obj._settings = obj._settings ? internals.concatSettings(obj._settings, schema._settings) : schema._settings;
    obj._valids.merge(schema._valids, schema._invalids);
    obj._invalids.merge(schema._invalids, schema._valids);
    obj._tests = obj._tests.concat(schema._tests);
    obj._refs = obj._refs.concat(schema._refs);
    Hoek.merge(obj._flags, schema._flags);

    obj._description = schema._description || obj._description;
    obj._unit = schema._unit || obj._unit;
    obj._notes = obj._notes.concat(schema._notes);
    obj._tags = obj._tags.concat(schema._tags);
    obj._examples = obj._examples.concat(schema._examples);
    obj._meta = obj._meta.concat(schema._meta);

    const inners = Object.keys(schema._inner);
    const isObject = obj._type === 'object';
    for (let i = 0; i < inners.length; ++i) {
        const key = inners[i];
        const source = schema._inner[key];
        if (source) {
            const target = obj._inner[key];
            if (target) {
                if (isObject && key === 'children') {
                    const keys = {};

                    for (let j = 0; j < target.length; ++j) {
                        keys[target[j].key] = j;
                    }

                    for (let j = 0; j < source.length; ++j) {
                        const sourceKey = source[j].key;
                        if (keys[sourceKey] >= 0) {
                            target[keys[sourceKey]] = {
                                key: sourceKey,
                                schema: target[keys[sourceKey]].schema.concat(source[j].schema)
                            };
                        }
                        else {
                            target.push(source[j]);
                        }
                    }
                }
                else {
                    obj._inner[key] = obj._inner[key].concat(source);
                }
            }
            else {
                obj._inner[key] = source.slice();
            }
        }
    }

    return obj;
};


internals.Any.prototype._test = function (name, arg, func) {

    Hoek.assert(!this._flags.allowOnly, 'Cannot define rules when valid values specified');

    const obj = this.clone();
    obj._tests.push({ func: func, name: name, arg: arg });
    return obj;
};


internals.Any.prototype.options = function (options) {

    Hoek.assert(!options.context, 'Cannot override context');
    internals.checkOptions(options);

    const obj = this.clone();
    obj._settings = internals.concatSettings(obj._settings, options);
    return obj;
};


internals.Any.prototype.strict = function (isStrict) {

    const obj = this.clone();
    obj._settings = obj._settings || {};
    obj._settings.convert = isStrict === undefined ? false : !isStrict;
    return obj;
};


internals.Any.prototype.raw = function (isRaw) {

    const obj = this.clone();
    obj._settings = obj._settings || {};
    obj._settings.raw = isRaw === undefined ? true : isRaw;
    return obj;
};


internals.Any.prototype._allow = function () {

    const values = Hoek.flatten(Array.prototype.slice.call(arguments));
    for (let i = 0; i < values.length; ++i) {
        const value = values[i];

        Hoek.assert(value !== undefined, 'Cannot call allow/valid/invalid with undefined');
        this._invalids.remove(value);
        this._valids.add(value, this._refs);
    }
};


internals.Any.prototype.allow = function () {

    const obj = this.clone();
    obj._allow.apply(obj, arguments);
    return obj;
};


internals.Any.prototype.valid = internals.Any.prototype.only = internals.Any.prototype.equal = function () {

    Hoek.assert(!this._tests.length, 'Cannot set valid values when rules specified');

    const obj = this.allow.apply(this, arguments);
    obj._flags.allowOnly = true;
    return obj;
};


internals.Any.prototype.invalid = internals.Any.prototype.disallow = internals.Any.prototype.not = function (value) {

    const obj = this.clone();
    const values = Hoek.flatten(Array.prototype.slice.call(arguments));
    for (let i = 0; i < values.length; ++i) {
        value = values[i];

        Hoek.assert(value !== undefined, 'Cannot call allow/valid/invalid with undefined');
        obj._valids.remove(value);
        obj._invalids.add(value, this._refs);
    }

    return obj;
};


internals.Any.prototype.required = internals.Any.prototype.exist = function () {

    const obj = this.clone();
    obj._flags.presence = 'required';
    return obj;
};


internals.Any.prototype.optional = function () {

    const obj = this.clone();
    obj._flags.presence = 'optional';
    return obj;
};


internals.Any.prototype.forbidden = function () {

    const obj = this.clone();
    obj._flags.presence = 'forbidden';
    return obj;
};


internals.Any.prototype.strip = function () {

    const obj = this.clone();
    obj._flags.strip = true;
    return obj;
};


internals.Any.prototype.applyFunctionToChildren = function (children, fn, args, root) {

    children = [].concat(children);

    if (children.length !== 1 || children[0] !== '') {
        root = root ? (root + '.') : '';

        const extraChildren = (children[0] === '' ? children.slice(1) : children).map((child) => {

            return root + child;
        });

        throw new Error('unknown key(s) ' + extraChildren.join(', '));
    }

    return this[fn].apply(this, args);
};


internals.Any.prototype.default = function (value, description) {

    if (typeof value === 'function' &&
        !Ref.isRef(value)) {

        if (!value.description &&
            description) {

            value.description = description;
        }

        if (!this._flags.func) {
            Hoek.assert(typeof value.description === 'string' && value.description.length > 0, 'description must be provided when default value is a function');
        }
    }

    const obj = this.clone();
    obj._flags.default = value;
    Ref.push(obj._refs, value);
    return obj;
};


internals.Any.prototype.empty = function (schema) {

    if (schema === undefined) {
        const obj = this.clone();
        obj._flags.empty = undefined;
        return obj;
    }

    schema = Cast.schema(schema);

    const obj = this.clone();
    obj._flags.empty = schema;
    return obj;
};


internals.Any.prototype.when = function (ref, options) {

    Hoek.assert(options && typeof options === 'object', 'Invalid options');
    Hoek.assert(options.then !== undefined || options.otherwise !== undefined, 'options must have at least one of "then" or "otherwise"');

    const then = options.then ? this.concat(Cast.schema(options.then)) : this;
    const otherwise = options.otherwise ? this.concat(Cast.schema(options.otherwise)) : this;

    Alternatives = Alternatives || require('./alternatives');
    const obj = Alternatives.when(ref, { is: options.is, then: then, otherwise: otherwise });
    obj._flags.presence = 'ignore';
    return obj;
};


internals.Any.prototype.description = function (desc) {

    Hoek.assert(desc && typeof desc === 'string', 'Description must be a non-empty string');

    const obj = this.clone();
    obj._description = desc;
    return obj;
};


internals.Any.prototype.notes = function (notes) {

    Hoek.assert(notes && (typeof notes === 'string' || Array.isArray(notes)), 'Notes must be a non-empty string or array');

    const obj = this.clone();
    obj._notes = obj._notes.concat(notes);
    return obj;
};


internals.Any.prototype.tags = function (tags) {

    Hoek.assert(tags && (typeof tags === 'string' || Array.isArray(tags)), 'Tags must be a non-empty string or array');

    const obj = this.clone();
    obj._tags = obj._tags.concat(tags);
    return obj;
};

internals.Any.prototype.meta = function (meta) {

    Hoek.assert(meta !== undefined, 'Meta cannot be undefined');

    const obj = this.clone();
    obj._meta = obj._meta.concat(meta);
    return obj;
};


internals.Any.prototype.example = function (value) {

    Hoek.assert(arguments.length, 'Missing example');
    const result = this._validate(value, null, internals.defaults);
    Hoek.assert(!result.errors, 'Bad example:', result.errors && Errors.process(result.errors, value));

    const obj = this.clone();
    obj._examples = obj._examples.concat(value);
    return obj;
};


internals.Any.prototype.unit = function (name) {

    Hoek.assert(name && typeof name === 'string', 'Unit name must be a non-empty string');

    const obj = this.clone();
    obj._unit = name;
    return obj;
};


internals._try = function (fn, arg) {

    let err;
    let result;

    try {
        result = fn.call(null, arg);
    }
    catch (e) {
        err = e;
    }

    return {
        value: result,
        error: err
    };
};


internals.Any.prototype._validate = function (value, state, options, reference) {

    const originalValue = value;

    // Setup state and settings

    state = state || { key: '', path: '', parent: null, reference: reference };

    if (this._settings) {
        options = internals.concatSettings(options, this._settings);
    }

    let errors = [];
    const finish = () => {

        let finalValue;

        if (!this._flags.strip) {
            if (value !== undefined) {
                finalValue = options.raw ? originalValue : value;
            }
            else if (options.noDefaults) {
                finalValue = originalValue;
            }
            else if (Ref.isRef(this._flags.default)) {
                finalValue = this._flags.default(state.parent, options);
            }
            else if (typeof this._flags.default === 'function' &&
                    !(this._flags.func && !this._flags.default.description)) {

                let arg;

                if (state.parent !== null &&
                    this._flags.default.length > 0) {

                    arg = Hoek.clone(state.parent);
                }

                const defaultValue = internals._try(this._flags.default, arg);
                finalValue = defaultValue.value;
                if (defaultValue.error) {
                    errors.push(Errors.create('any.default', defaultValue.error, state, options));
                }
            }
            else {
                finalValue = this._flags.default;
            }
        }

        return {
            value: finalValue,
            errors: errors.length ? errors : null
        };
    };

    // Check presence requirements

    const presence = this._flags.presence || options.presence;
    if (presence === 'optional') {
        if (value === undefined) {
            const isDeepDefault = this._flags.hasOwnProperty('default') && this._flags.default === undefined;
            if (isDeepDefault && this._type === 'object') {
                value = {};
            }
            else {
                return finish();
            }
        }
    }
    else if (presence === 'required' &&
            value === undefined) {

        errors.push(Errors.create('any.required', null, state, options));
        return finish();
    }
    else if (presence === 'forbidden') {
        if (value === undefined) {
            return finish();
        }

        errors.push(Errors.create('any.unknown', null, state, options));
        return finish();
    }

    if (this._flags.empty && !this._flags.empty._validate(value, null, internals.defaults).errors) {
        value = undefined;
        return finish();
    }

    // Check allowed and denied values using the original value

    if (this._valids.has(value, state, options, this._flags.insensitive)) {
        return finish();
    }

    if (this._invalids.has(value, state, options, this._flags.insensitive)) {
        errors.push(Errors.create(value === '' ? 'any.empty' : 'any.invalid', null, state, options));
        if (options.abortEarly ||
            value === undefined) {          // No reason to keep validating missing value

            return finish();
        }
    }

    // Convert value and validate type

    if (this._base) {
        const base = this._base.call(this, value, state, options);
        if (base.errors) {
            value = base.value;
            errors = errors.concat(base.errors);
            return finish();                            // Base error always aborts early
        }

        if (base.value !== value) {
            value = base.value;

            // Check allowed and denied values using the converted value

            if (this._valids.has(value, state, options, this._flags.insensitive)) {
                return finish();
            }

            if (this._invalids.has(value, state, options, this._flags.insensitive)) {
                errors.push(Errors.create('any.invalid', null, state, options));
                if (options.abortEarly) {
                    return finish();
                }
            }
        }
    }

    // Required values did not match

    if (this._flags.allowOnly) {
        errors.push(Errors.create('any.allowOnly', { valids: this._valids.values({ stripUndefined: true }) }, state, options));
        if (options.abortEarly) {
            return finish();
        }
    }

    // Helper.validate tests

    for (let i = 0; i < this._tests.length; ++i) {
        const test = this._tests[i];
        const err = test.func.call(this, value, state, options);
        if (err) {
            errors.push(err);
            if (options.abortEarly) {
                return finish();
            }
        }
    }

    return finish();
};


internals.Any.prototype._validateWithOptions = function (value, options, callback) {

    if (options) {
        internals.checkOptions(options);
    }

    const settings = internals.concatSettings(internals.defaults, options);
    const result = this._validate(value, null, settings);
    const errors = Errors.process(result.errors, value);

    if (callback) {
        return callback(errors, result.value);
    }

    return { error: errors, value: result.value };
};


internals.Any.prototype.validate = function (value, callback) {

    const result = this._validate(value, null, internals.defaults);
    const errors = Errors.process(result.errors, value);

    if (callback) {
        return callback(errors, result.value);
    }

    return { error: errors, value: result.value };
};


internals.Any.prototype.describe = function () {

    const description = {
        type: this._type
    };

    const flags = Object.keys(this._flags);
    if (flags.length) {
        if (this._flags.empty) {
            description.flags = {};
            for (let i = 0; i < flags.length; ++i) {
                const flag = flags[i];
                description.flags[flag] = flag === 'empty' ? this._flags[flag].describe() : this._flags[flag];
            }
        }
        else {
            description.flags = this._flags;
        }
    }

    if (this._description) {
        description.description = this._description;
    }

    if (this._notes.length) {
        description.notes = this._notes;
    }

    if (this._tags.length) {
        description.tags = this._tags;
    }

    if (this._meta.length) {
        description.meta = this._meta;
    }

    if (this._examples.length) {
        description.examples = this._examples;
    }

    if (this._unit) {
        description.unit = this._unit;
    }

    const valids = this._valids.values();
    if (valids.length) {
        description.valids = valids;
    }

    const invalids = this._invalids.values();
    if (invalids.length) {
        description.invalids = invalids;
    }

    description.rules = [];

    for (let i = 0; i < this._tests.length; ++i) {
        const validator = this._tests[i];
        const item = { name: validator.name };
        if (validator.arg !== void 0) {
            item.arg = validator.arg;
        }
        description.rules.push(item);
    }

    if (!description.rules.length) {
        delete description.rules;
    }

    const label = Hoek.reach(this._settings, 'language.label');
    if (label) {
        description.label = label;
    }

    return description;
};

internals.Any.prototype.label = function (name) {

    Hoek.assert(name && typeof name === 'string', 'Label name must be a non-empty string');

    const obj = this.clone();
    const options = { language: { label: name } };

    // If language.label is set, it should override this label
    obj._settings = internals.concatSettings(options, obj._settings);
    return obj;
};


// Set

internals.Set = function () {

    this._set = [];
};


internals.Set.prototype.add = function (value, refs) {

    Hoek.assert(value === null || value === undefined || value instanceof Date || Buffer.isBuffer(value) || Ref.isRef(value) || (typeof value !== 'function' && typeof value !== 'object'), 'Value cannot be an object or function');

    if (typeof value !== 'function' &&
        this.has(value, null, null, false)) {

        return;
    }

    Ref.push(refs, value);
    this._set.push(value);
};


internals.Set.prototype.merge = function (add, remove) {

    for (let i = 0; i < add._set.length; ++i) {
        this.add(add._set[i]);
    }

    for (let i = 0; i < remove._set.length; ++i) {
        this.remove(remove._set[i]);
    }
};


internals.Set.prototype.remove = function (value) {

    this._set = this._set.filter((item) => value !== item);
};


internals.Set.prototype.has = function (value, state, options, insensitive) {

    for (let i = 0; i < this._set.length; ++i) {
        let items = this._set[i];

        if (Ref.isRef(items)) {
            items = items(state.reference || state.parent, options);
        }

        if (!Array.isArray(items)) {
            items = [items];
        }

        for (let j = 0; j < items.length; ++j) {
            const item = items[j];
            if (typeof value !== typeof item) {
                continue;
            }

            if (value === item ||
                (value instanceof Date && item instanceof Date && value.getTime() === item.getTime()) ||
                (insensitive && typeof value === 'string' && value.toLowerCase() === item.toLowerCase()) ||
                (Buffer.isBuffer(value) && Buffer.isBuffer(item) && value.length === item.length && value.toString('binary') === item.toString('binary'))) {

                return true;
            }
        }
    }

    return false;
};


internals.Set.prototype.values = function (options) {

    if (options && options.stripUndefined) {
        const values = [];

        for (let i = 0; i < this._set.length; ++i) {
            const item = this._set[i];
            if (item !== undefined) {
                values.push(item);
            }
        }

        return values;
    }

    return this._set.slice();
};


internals.concatSettings = function (target, source) {

    // Used to avoid cloning context

    if (!target &&
        !source) {

        return null;
    }

    const obj = {};

    if (target) {
        const tKeys = Object.keys(target);
        for (let i = 0; i < tKeys.length; ++i) {
            const key = tKeys[i];
            obj[key] = target[key];
        }
    }

    if (source) {
        const sKeys = Object.keys(source);
        for (let i = 0; i < sKeys.length; ++i) {
            const key = sKeys[i];
            if (key !== 'language' ||
                !obj.hasOwnProperty(key)) {

                obj[key] = source[key];
            }
            else {
                obj[key] = Hoek.applyToDefaults(obj[key], source[key]);
            }
        }
    }

    return obj;
};

}).call(this,{"isBuffer":require("../../../../../../../../usr/local/lib/node_modules/browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js")})

},{"../../../../../../../../usr/local/lib/node_modules/browserify/node_modules/insert-module-globals/node_modules/is-buffer/index.js":22,"./alternatives":1,"./cast":5,"./errors":7,"./ref":12,"hoek":18}],3:[function(require,module,exports){
'use strict';

// Load modules

const Any = require('./any');
const Cast = require('./cast');
const Errors = require('./errors');
const Hoek = require('hoek');


// Declare internals

const internals = {};


internals.fastSplice = function (arr, i) {

    let pos = i;
    while (pos < arr.length) {
        arr[pos++] = arr[pos];
    }

    --arr.length;
};


internals.Array = function () {

    Any.call(this);
    this._type = 'array';
    this._inner.items = [];
    this._inner.ordereds = [];
    this._inner.inclusions = [];
    this._inner.exclusions = [];
    this._inner.requireds = [];
    this._flags.sparse = false;
};

Hoek.inherits(internals.Array, Any);


internals.Array.prototype._base = function (value, state, options) {

    const result = {
        value: value
    };

    if (typeof value === 'string' &&
        options.convert) {

        try {
            const converted = JSON.parse(value);
            if (Array.isArray(converted)) {
                result.value = converted;
            }
        }
        catch (e) { }
    }

    let isArray = Array.isArray(result.value);
    const wasArray = isArray;
    if (options.convert && this._flags.single && !isArray) {
        result.value = [result.value];
        isArray = true;
    }

    if (!isArray) {
        result.errors = Errors.create('array.base', null, state, options);
        return result;
    }

    if (this._inner.inclusions.length ||
        this._inner.exclusions.length ||
        !this._flags.sparse) {

        // Clone the array so that we don't modify the original
        if (wasArray) {
            result.value = result.value.slice(0);
        }

        result.errors = internals.checkItems.call(this, result.value, wasArray, state, options);

        if (result.errors && wasArray && options.convert && this._flags.single) {

            // Attempt a 2nd pass by putting the array inside one.
            const previousErrors = result.errors;

            result.value = [result.value];
            result.errors = internals.checkItems.call(this, result.value, wasArray, state, options);

            if (result.errors) {

                // Restore previous errors and value since this didn't validate either.
                result.errors = previousErrors;
                result.value = result.value[0];
            }
        }
    }

    return result;
};


internals.checkItems = function (items, wasArray, state, options) {

    const errors = [];
    let errored;

    const requireds = this._inner.requireds.slice();
    const ordereds = this._inner.ordereds.slice();
    const inclusions = this._inner.inclusions.concat(requireds);

    let il = items.length;
    for (let i = 0; i < il; ++i) {
        errored = false;
        const item = items[i];
        let isValid = false;
        const localState = { key: i, path: (state.path ? state.path + '.' : '') + i, parent: items, reference: state.reference };
        let res;

        // Sparse

        if (!this._flags.sparse && item === undefined) {
            errors.push(Errors.create('array.sparse', null, { key: state.key, path: localState.path }, options));

            if (options.abortEarly) {
                return errors;
            }

            continue;
        }

        // Exclusions

        for (let j = 0; j < this._inner.exclusions.length; ++j) {
            res = this._inner.exclusions[j]._validate(item, localState, {});                // Not passing options to use defaults

            if (!res.errors) {
                errors.push(Errors.create(wasArray ? 'array.excludes' : 'array.excludesSingle', { pos: i, value: item }, { key: state.key, path: localState.path }, options));
                errored = true;

                if (options.abortEarly) {
                    return errors;
                }

                break;
            }
        }

        if (errored) {
            continue;
        }

        // Ordered
        if (this._inner.ordereds.length) {
            if (ordereds.length > 0) {
                const ordered = ordereds.shift();
                res = ordered._validate(item, localState, options);
                if (!res.errors) {
                    if (ordered._flags.strip) {
                        internals.fastSplice(items, i);
                        --i;
                        --il;
                    }
                    else {
                        items[i] = res.value;
                    }
                }
                else {
                    errors.push(Errors.create('array.ordered', { pos: i, reason: res.errors, value: item }, { key: state.key, path: localState.path }, options));
                    if (options.abortEarly) {
                        return errors;
                    }
                }
                continue;
            }
            else if (!this._inner.items.length) {
                errors.push(Errors.create('array.orderedLength', { pos: i, limit: this._inner.ordereds.length }, { key: state.key, path: localState.path }, options));
                if (options.abortEarly) {
                    return errors;
                }
                continue;
            }
        }

        // Requireds

        const requiredChecks = [];
        let jl = requireds.length;
        for (let j = 0; j < jl; ++j) {
            res = requiredChecks[j] = requireds[j]._validate(item, localState, options);
            if (!res.errors) {
                items[i] = res.value;
                isValid = true;
                internals.fastSplice(requireds, j);
                --j;
                --jl;
                break;
            }
        }

        if (isValid) {
            continue;
        }

        // Inclusions

        jl = inclusions.length;
        for (let j = 0; j < jl; ++j) {
            const inclusion = inclusions[j];

            // Avoid re-running requireds that already didn't match in the previous loop
            const previousCheck = requireds.indexOf(inclusion);
            if (previousCheck !== -1) {
                res = requiredChecks[previousCheck];
            }
            else {
                res = inclusion._validate(item, localState, options);

                if (!res.errors) {
                    if (inclusion._flags.strip) {
                        internals.fastSplice(items, i);
                        --i;
                        --il;
                    }
                    else {
                        items[i] = res.value;
                    }
                    isValid = true;
                    break;
                }
            }

            // Return the actual error if only one inclusion defined
            if (jl === 1) {
                if (options.stripUnknown) {
                    internals.fastSplice(items, i);
                    --i;
                    --il;
                    isValid = true;
                    break;
                }

                errors.push(Errors.create(wasArray ? 'array.includesOne' : 'array.includesOneSingle', { pos: i, reason: res.errors, value: item }, { key: state.key, path: localState.path }, options));
                errored = true;

                if (options.abortEarly) {
                    return errors;
                }

                break;
            }
        }

        if (errored) {
            continue;
        }

        if (this._inner.inclusions.length && !isValid) {
            if (options.stripUnknown) {
                internals.fastSplice(items, i);
                --i;
                --il;
                continue;
            }

            errors.push(Errors.create(wasArray ? 'array.includes' : 'array.includesSingle', { pos: i, value: item }, { key: state.key, path: localState.path }, options));

            if (options.abortEarly) {
                return errors;
            }
        }
    }

    if (requireds.length) {
        internals.fillMissedErrors(errors, requireds, state, options);
    }

    if (ordereds.length) {
        internals.fillOrderedErrors(errors, ordereds, state, options);
    }

    return errors.length ? errors : null;
};


internals.fillMissedErrors = function (errors, requireds, state, options) {

    const knownMisses = [];
    let unknownMisses = 0;
    for (let i = 0; i < requireds.length; ++i) {
        const label = Hoek.reach(requireds[i], '_settings.language.label');
        if (label) {
            knownMisses.push(label);
        }
        else {
            ++unknownMisses;
        }
    }

    if (knownMisses.length) {
        if (unknownMisses) {
            errors.push(Errors.create('array.includesRequiredBoth', { knownMisses: knownMisses, unknownMisses: unknownMisses }, { key: state.key, path: state.patk }, options));
        }
        else {
            errors.push(Errors.create('array.includesRequiredKnowns', { knownMisses: knownMisses }, { key: state.key, path: state.path }, options));
        }
    }
    else {
        errors.push(Errors.create('array.includesRequiredUnknowns', { unknownMisses: unknownMisses }, { key: state.key, path: state.path }, options));
    }
};


internals.fillOrderedErrors = function (errors, ordereds, state, options) {

    const requiredOrdereds = [];

    for (let i = 0; i < ordereds.length; ++i) {
        const presence = Hoek.reach(ordereds[i], '_flags.presence');
        if (presence === 'required') {
            requiredOrdereds.push(ordereds[i]);
        }
    }

    if (requiredOrdereds.length) {
        internals.fillMissedErrors(errors, requiredOrdereds, state, options);
    }
};

internals.Array.prototype.describe = function () {

    const description = Any.prototype.describe.call(this);

    if (this._inner.ordereds.length) {
        description.orderedItems = [];

        for (let i = 0; i < this._inner.ordereds.length; ++i) {
            description.orderedItems.push(this._inner.ordereds[i].describe());
        }
    }

    if (this._inner.items.length) {
        description.items = [];

        for (let i = 0; i < this._inner.items.length; ++i) {
            description.items.push(this._inner.items[i].describe());
        }
    }

    return description;
};


internals.Array.prototype.items = function () {

    const obj = this.clone();

    Hoek.flatten(Array.prototype.slice.call(arguments)).forEach((type, index) => {

        try {
            type = Cast.schema(type);
        }
        catch (castErr) {
            if (castErr.hasOwnProperty('path')) {
                castErr.path = index + '.' + castErr.path;
            }
            else {
                castErr.path = index;
            }
            castErr.message = castErr.message + '(' + castErr.path + ')';
            throw castErr;
        }

        obj._inner.items.push(type);

        if (type._flags.presence === 'required') {
            obj._inner.requireds.push(type);
        }
        else if (type._flags.presence === 'forbidden') {
            obj._inner.exclusions.push(type.optional());
        }
        else {
            obj._inner.inclusions.push(type);
        }
    });

    return obj;
};


internals.Array.prototype.ordered = function () {

    const obj = this.clone();

    Hoek.flatten(Array.prototype.slice.call(arguments)).forEach((type, index) => {

        try {
            type = Cast.schema(type);
        }
        catch (castErr) {
            if (castErr.hasOwnProperty('path')) {
                castErr.path = index + '.' + castErr.path;
            }
            else {
                castErr.path = index;
            }
            castErr.message = castErr.message + '(' + castErr.path + ')';
            throw castErr;
        }
        obj._inner.ordereds.push(type);
    });

    return obj;
};


internals.Array.prototype.min = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('min', limit, (value, state, options) => {

        if (value.length >= limit) {
            return null;
        }

        return Errors.create('array.min', { limit: limit, value: value }, state, options);
    });
};


internals.Array.prototype.max = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('max', limit, (value, state, options) => {

        if (value.length <= limit) {
            return null;
        }

        return Errors.create('array.max', { limit: limit, value: value }, state, options);
    });
};


internals.Array.prototype.length = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('length', limit, (value, state, options) => {

        if (value.length === limit) {
            return null;
        }

        return Errors.create('array.length', { limit: limit, value: value }, state, options);
    });
};


internals.Array.prototype.unique = function () {

    return this._test('unique', undefined, (value, state, options) => {

        const found = {
            string: {},
            number: {},
            undefined: {},
            boolean: {},
            object: [],
            function: []
        };

        for (let i = 0; i < value.length; ++i) {
            const item = value[i];
            const type = typeof item;
            const records = found[type];

            // All available types are supported, so it's not possible to reach 100% coverage without ignoring this line.
            // I still want to keep the test for future js versions with new types (eg. Symbol).
            if (/* $lab:coverage:off$ */ records /* $lab:coverage:on$ */) {
                if (Array.isArray(records)) {
                    for (let j = 0; j < records.length; ++j) {
                        if (Hoek.deepEqual(records[j], item)) {
                            return Errors.create('array.unique', { pos: i, value: item }, state, options);
                        }
                    }

                    records.push(item);
                }
                else {
                    if (records[item]) {
                        return Errors.create('array.unique', { pos: i, value: item }, state, options);
                    }

                    records[item] = true;
                }
            }
        }
    });
};


internals.Array.prototype.sparse = function (enabled) {

    const obj = this.clone();
    obj._flags.sparse = enabled === undefined ? true : !!enabled;
    return obj;
};


internals.Array.prototype.single = function (enabled) {

    const obj = this.clone();
    obj._flags.single = enabled === undefined ? true : !!enabled;
    return obj;
};


module.exports = new internals.Array();

},{"./any":2,"./cast":5,"./errors":7,"hoek":18}],4:[function(require,module,exports){
"use strict";const Any=require("./any"),Errors=require("./errors"),Hoek=require("hoek"),internals={};internals.Boolean=function(){Any.call(this),this._type="boolean"},Hoek.inherits(internals.Boolean,Any),internals.Boolean.prototype._base=function(e,o,n){const r={value:e};if("string"==typeof e&&n.convert){const t=e.toLowerCase();r.value="true"===t||"yes"===t||"on"===t?!0:"false"===t||"no"===t||"off"===t?!1:e}return r.errors="boolean"==typeof r.value?null:Errors.create("boolean.base",null,o,n),r},module.exports=new internals.Boolean;
},{"./any":2,"./errors":7,"hoek":18}],5:[function(require,module,exports){
"use strict";const Hoek=require("hoek"),Ref=require("./ref"),internals={any:null,date:require("./date"),string:require("./string"),number:require("./number"),"boolean":require("./boolean"),alt:null,object:null};exports.schema=function(e){return internals.any=internals.any||new(require("./any")),internals.alt=internals.alt||require("./alternatives"),internals.object=internals.object||require("./object"),e&&"object"==typeof e?e.isJoi?e:Array.isArray(e)?internals.alt["try"](e):e instanceof RegExp?internals.string.regex(e):e instanceof Date?internals.date.valid(e):internals.object.keys(e):"string"==typeof e?internals.string.valid(e):"number"==typeof e?internals.number.valid(e):"boolean"==typeof e?internals["boolean"].valid(e):Ref.isRef(e)?internals.any.valid(e):(Hoek.assert(null===e,"Invalid schema content:",e),internals.any.valid(null))},exports.ref=function(e){return Ref.isRef(e)?e:Ref.create(e)};
},{"./alternatives":1,"./any":2,"./boolean":4,"./date":6,"./number":10,"./object":11,"./ref":12,"./string":13,"hoek":18}],6:[function(require,module,exports){
'use strict';

// Load modules

const Any = require('./any');
const Errors = require('./errors');
const Ref = require('./ref');
const Hoek = require('hoek');
const Moment = require('moment');


// Declare internals

const internals = {};

internals.isoDate = /^(?:\d{4}(?!\d{2}\b))(?:(-?)(?:(?:0[1-9]|1[0-2])(?:\1(?:[12]\d|0[1-9]|3[01]))?|W(?:[0-4]\d|5[0-2])(?:-?[1-7])?|(?:00[1-9]|0[1-9]\d|[12]\d{2}|3(?:[0-5]\d|6[1-6])))(?![T]$|[T][\d]+Z$)(?:[T\s](?:(?:(?:[01]\d|2[0-3])(?:(:?)[0-5]\d)?|24\:?00)(?:[.,]\d+(?!:))?)(?:\2[0-5]\d(?:[.,]\d+)?)?(?:[Z]|(?:[+-])(?:[01]\d|2[0-3])(?::?[0-5]\d)?)?)?)?$/;
internals.invalidDate = new Date('');
internals.isIsoDate = (() => {

    const isoString = internals.isoDate.toString();

    return (date) => {

        return date && (date.toString() === isoString);
    };
})();

internals.Date = function () {

    Any.call(this);
    this._type = 'date';
};

Hoek.inherits(internals.Date, Any);


internals.Date.prototype._base = function (value, state, options) {

    const result = {
        value: (options.convert && internals.toDate(value, this._flags.format)) || value
    };

    if (result.value instanceof Date && !isNaN(result.value.getTime())) {
        result.errors = null;
    }
    else {
        result.errors = Errors.create(internals.isIsoDate(this._flags.format) ? 'date.isoDate' : 'date.base', null, state, options);
    }

    return result;
};


internals.toDate = function (value, format) {

    if (value instanceof Date) {
        return value;
    }

    if (typeof value === 'string' ||
        Hoek.isInteger(value)) {

        if (typeof value === 'string' &&
            /^[+-]?\d+$/.test(value)) {

            value = parseInt(value, 10);
        }

        let date;
        if (format) {
            if (internals.isIsoDate(format)) {
                date = format.test(value) ? new Date(value) : internals.invalidDate;
            }
            else {
                date = Moment(value, format, true);
                date = date.isValid() ? date.toDate() : internals.invalidDate;
            }
        }
        else {
            date = new Date(value);
        }

        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    return null;
};


internals.compare = function (type, compare) {

    return function (date) {

        const isNow = date === 'now';
        const isRef = Ref.isRef(date);

        if (!isNow && !isRef) {
            date = internals.toDate(date);
        }

        Hoek.assert(date, 'Invalid date format');

        return this._test(type, date, (value, state, options) => {

            let compareTo;
            if (isNow) {
                compareTo = Date.now();
            }
            else if (isRef) {
                compareTo = internals.toDate(date(state.parent, options));

                if (!compareTo) {
                    return Errors.create('date.ref', { ref: date.key }, state, options);
                }

                compareTo = compareTo.getTime();
            }
            else {
                compareTo = date.getTime();
            }

            if (compare(value.getTime(), compareTo)) {
                return null;
            }

            return Errors.create('date.' + type, { limit: new Date(compareTo) }, state, options);
        });
    };
};


internals.Date.prototype.min = internals.compare('min', (value, date) => value >= date);
internals.Date.prototype.max = internals.compare('max', (value, date) => value <= date);


internals.Date.prototype.format = function (format) {

    Hoek.assert(typeof format === 'string' || (Array.isArray(format) && format.every((f) => typeof f === 'string')), 'Invalid format.');

    const obj = this.clone();
    obj._flags.format = format;
    return obj;
};

internals.Date.prototype.iso = function () {

    const obj = this.clone();
    obj._flags.format = internals.isoDate;
    return obj;
};

internals.Date.prototype._isIsoDate = function (value) {

    return internals.isoDate.test(value);
};

module.exports = new internals.Date();

},{"./any":2,"./errors":7,"./ref":12,"hoek":18,"moment":20}],7:[function(require,module,exports){
'use strict';

// Load modules

const Hoek = require('hoek');
const Language = require('./language');


// Declare internals

const internals = {};

internals.stringify = function (value, wrapArrays) {

    const type = typeof value;

    if (value === null) {
        return 'null';
    }

    if (type === 'string') {
        return value;
    }

    if (value instanceof internals.Err || type === 'function') {
        return value.toString();
    }

    if (type === 'object') {
        if (Array.isArray(value)) {
            let partial = '';

            for (let i = 0; i < value.length; ++i) {
                partial = partial + (partial.length ? ', ' : '') + internals.stringify(value[i], wrapArrays);
            }

            return wrapArrays ? '[' + partial + ']' : partial;
        }

        return value.toString();
    }

    return JSON.stringify(value);
};

internals.Err = function (type, context, state, options) {

    this.type = type;
    this.context = context || {};
    this.context.key = state.key;
    this.path = state.path;
    this.options = options;
};


internals.Err.prototype.toString = function () {

    const localized = this.options.language;

    if (localized.label) {
        this.context.key = localized.label;
    }
    else if (this.context.key === '' || this.context.key === null) {
        this.context.key = localized.root || Language.errors.root;
    }

    let format = Hoek.reach(localized, this.type) || Hoek.reach(Language.errors, this.type);
    const hasKey = /\{\{\!?key\}\}/.test(format);
    const skipKey = format.length > 2 && format[0] === '!' && format[1] === '!';

    if (skipKey) {
        format = format.slice(2);
    }

    if (!hasKey && !skipKey) {
        format = (Hoek.reach(localized, 'key') || Hoek.reach(Language.errors, 'key')) + format;
    }

    let wrapArrays = Hoek.reach(localized, 'messages.wrapArrays');
    if (typeof wrapArrays !== 'boolean') {
        wrapArrays = Language.errors.messages.wrapArrays;
    }

    const message = format.replace(/\{\{(\!?)([^}]+)\}\}/g, ($0, isSecure, name) => {

        const value = Hoek.reach(this.context, name);
        const normalized = internals.stringify(value, wrapArrays);
        return (isSecure ? Hoek.escapeHtml(normalized) : normalized);
    });

    return message;
};


exports.create = function (type, context, state, options) {

    return new internals.Err(type, context, state, options);
};


exports.process = function (errors, object) {

    if (!errors || !errors.length) {
        return null;
    }

    // Construct error

    let message = '';
    const details = [];

    const processErrors = function (localErrors, parent) {

        for (let i = 0; i < localErrors.length; ++i) {
            const item = localErrors[i];

            const detail = {
                message: item.toString(),
                path: internals.getPath(item),
                type: item.type,
                context: item.context
            };

            if (!parent) {
                message = message + (message ? '. ' : '') + detail.message;
            }

            // Do not push intermediate errors, we're only interested in leafs
            if (item.context.reason && item.context.reason.length) {
                processErrors(item.context.reason, item.path);
            }
            else {
                details.push(detail);
            }
        }
    };

    processErrors(errors);

    const error = new Error(message);
    error.name = 'ValidationError';
    error.details = details;
    error._object = object;
    error.annotate = internals.annotate;
    return error;
};


internals.getPath = function (item) {

    const recursePath = (it) => {

        const reachedItem = Hoek.reach(it, 'context.reason.0');
        if (reachedItem && reachedItem.context) {
            return recursePath(reachedItem);
        }

        return it.path;
    };

    return recursePath(item) || item.context.key;
};


// Inspired by json-stringify-safe
internals.safeStringify = function (obj, spaces) {

    return JSON.stringify(obj, internals.serializer(), spaces);
};

internals.serializer = function () {

    const cycleReplacer = (key, value) => {

        if (stack[0] === value) {
            return '[Circular ~]';
        }

        return '[Circular ~.' + keys.slice(0, stack.indexOf(value)).join('.') + ']';
    };

    const keys = [], stack = [];

    return function (key, value) {

        if (stack.length > 0) {
            const thisPos = stack.indexOf(this);
            if (~thisPos) {
                stack.length = thisPos + 1;
                keys.length = thisPos + 1;
                keys[thisPos] = key;
            }
            else {
                stack.push(this);
                keys.push(key);
            }

            if (~stack.indexOf(value)) {
                value = cycleReplacer.call(this, key, value);
            }
        }
        else {
            stack.push(value);
        }

        if (Array.isArray(value) && value.placeholders) {
            const placeholders = value.placeholders;
            const arrWithPlaceholders = [];
            for (let i = 0; i < value.length; ++i) {
                if (placeholders[i]) {
                    arrWithPlaceholders.push(placeholders[i]);
                }
                arrWithPlaceholders.push(value[i]);
            }

            value = arrWithPlaceholders;
        }

        return value;
    };
};


internals.annotate = function () {

    if (typeof this._object !== 'object') {
        return this.details[0].message;
    }

    const obj = Hoek.clone(this._object || {});

    const lookup = {};
    for (let i = this.details.length - 1; i >= 0; --i) {        // Reverse order to process deepest child first
        const pos = this.details.length - i;
        const error = this.details[i];
        const path = error.path.split('.');
        let ref = obj;
        for (let j = 0; j < path.length && ref; ++j) {
            const seg = path[j];
            if (j + 1 < path.length) {
                ref = ref[seg];
            }
            else {
                const value = ref[seg];
                if (Array.isArray(ref)) {
                    const arrayLabel = '_$idx$_' + (i + 1) + '_$end$_';
                    if (!ref.placeholders) {
                        ref.placeholders = {};
                    }

                    if (ref.placeholders[seg]) {
                        ref.placeholders[seg] = ref.placeholders[seg].replace('_$end$_', ', ' + (i + 1) + '_$end$_');
                    }
                    else {
                        ref.placeholders[seg] = arrayLabel;
                    }
                }
                else {
                    if (value !== undefined) {
                        delete ref[seg];
                        const objectLabel = seg + '_$key$_' + pos + '_$end$_';
                        ref[objectLabel] = value;
                        lookup[error.path] = objectLabel;
                    }
                    else if (lookup[error.path]) {
                        const replacement = lookup[error.path];
                        const appended = replacement.replace('_$end$_', ', ' + pos + '_$end$_');
                        ref[appended] = ref[replacement];
                        lookup[error.path] = appended;
                        delete ref[replacement];
                    }
                    else {
                        ref['_$miss$_' + seg + '|' + pos + '_$end$_'] = '__missing__';
                    }
                }
            }
        }
    }

    let message = internals.safeStringify(obj, 2)
        .replace(/_\$key\$_([, \d]+)_\$end\$_\"/g, ($0, $1) => {

            return '" \u001b[31m[' + $1 + ']\u001b[0m';
        }).replace(/\"_\$miss\$_([^\|]+)\|(\d+)_\$end\$_\"\: \"__missing__\"/g, ($0, $1, $2) => {

            return '\u001b[41m"' + $1 + '"\u001b[0m\u001b[31m [' + $2 + ']: -- missing --\u001b[0m';
        }).replace(/\s*\"_\$idx\$_([, \d]+)_\$end\$_\",?\n(.*)/g, ($0, $1, $2) => {

            return '\n' + $2 + ' \u001b[31m[' + $1 + ']\u001b[0m';
        });

    message = message + '\n\u001b[31m';

    for (let i = 0; i < this.details.length; ++i) {
        message = message + '\n[' + (i + 1) + '] ' + this.details[i].message;
    }

    message = message + '\u001b[0m';

    return message;
};

},{"./language":9,"hoek":18}],8:[function(require,module,exports){
"use strict";const Any=require("./any"),Cast=require("./cast"),Ref=require("./ref"),internals={alternatives:require("./alternatives"),array:require("./array"),"boolean":require("./boolean"),binary:require("./binary"),date:require("./date"),number:require("./number"),object:require("./object"),string:require("./string")};internals.root=function(){const n=new Any,e=n.clone();return e.any=function(){return n},e.alternatives=e.alt=function(){return arguments.length?internals.alternatives["try"].apply(internals.alternatives,arguments):internals.alternatives},e.array=function(){return internals.array},e["boolean"]=e.bool=function(){return internals["boolean"]},e.binary=function(){return internals.binary},e.date=function(){return internals.date},e.func=function(){return internals.object._func()},e.number=function(){return internals.number},e.object=function(){return arguments.length?internals.object.keys.apply(internals.object,arguments):internals.object},e.string=function(){return internals.string},e.ref=function(){return Ref.create.apply(null,arguments)},e.isRef=function(n){return Ref.isRef(n)},e.validate=function(t){const r=arguments[arguments.length-1],a="function"==typeof r?r:null,i=arguments.length-(a?1:0);if(1===i)return n.validate(t,a);const u=3===i?arguments[2]:{},s=e.compile(arguments[1]);return s._validateWithOptions(t,u,a)},e.describe=function(){const t=arguments.length?e.compile(arguments[0]):n;return t.describe()},e.compile=function(n){try{return Cast.schema(n)}catch(e){throw e.hasOwnProperty("path")&&(e.message=e.message+"("+e.path+")"),e}},e.assert=function(n,t,r){e.attempt(n,t,r)},e.attempt=function(n,t,r){const a=e.validate(n,t),i=a.error;if(i){if(!r)throw i.message=i.annotate(),i;if(!(r instanceof Error))throw i.message=r+" "+i.annotate(),i;throw r}return a.value},e},module.exports=internals.root();
},{"./alternatives":1,"./any":2,"./array":3,"./binary":20,"./boolean":4,"./cast":5,"./date":6,"./number":10,"./object":11,"./ref":12,"./string":13}],9:[function(require,module,exports){
"use strict";const internals={};exports.errors={root:"value",key:'"{{!key}}" ',messages:{wrapArrays:!0},any:{unknown:"is not allowed",invalid:"contains an invalid value",empty:"is not allowed to be empty",required:"is required",allowOnly:"must be one of {{valids}}","default":"threw an error when running default method"},alternatives:{base:"not matching any of the allowed alternatives"},array:{base:"must be an array",includes:"at position {{pos}} does not match any of the allowed types",includesSingle:'single value of "{{!key}}" does not match any of the allowed types',includesOne:"at position {{pos}} fails because {{reason}}",includesOneSingle:'single value of "{{!key}}" fails because {{reason}}',includesRequiredUnknowns:"does not contain {{unknownMisses}} required value(s)",includesRequiredKnowns:"does not contain {{knownMisses}}",includesRequiredBoth:"does not contain {{knownMisses}} and {{unknownMisses}} other required value(s)",excludes:"at position {{pos}} contains an excluded value",excludesSingle:'single value of "{{!key}}" contains an excluded value',min:"must contain at least {{limit}} items",max:"must contain less than or equal to {{limit}} items",length:"must contain {{limit}} items",ordered:"at position {{pos}} fails because {{reason}}",orderedLength:"at position {{pos}} fails because array must contain at most {{limit}} items",sparse:"must not be a sparse array",unique:"position {{pos}} contains a duplicate value"},"boolean":{base:"must be a boolean"},binary:{base:"must be a buffer or a string",min:"must be at least {{limit}} bytes",max:"must be less than or equal to {{limit}} bytes",length:"must be {{limit}} bytes"},date:{base:"must be a number of milliseconds or valid date string",min:'must be larger than or equal to "{{limit}}"',max:'must be less than or equal to "{{limit}}"',isoDate:"must be a valid ISO 8601 date",ref:'references "{{ref}}" which is not a date'},"function":{base:"must be a Function"},object:{base:"must be an object",child:'child "{{!key}}" fails because {{reason}}',min:"must have at least {{limit}} children",max:"must have less than or equal to {{limit}} children",length:"must have {{limit}} children",allowUnknown:"is not allowed","with":'missing required peer "{{peer}}"',without:'conflict with forbidden peer "{{peer}}"',missing:"must contain at least one of {{peers}}",xor:"contains a conflict between exclusive peers {{peers}}",or:"must contain at least one of {{peers}}",and:"contains {{present}} without its required peers {{missing}}",nand:'!!"{{main}}" must not exist simultaneously with {{peers}}',assert:'!!"{{ref}}" validation failed because "{{ref}}" failed to {{message}}',rename:{multiple:'cannot rename child "{{from}}" because multiple renames are disabled and another key was already renamed to "{{to}}"',override:'cannot rename child "{{from}}" because override is disabled and target "{{to}}" exists'},type:'must be an instance of "{{type}}"'},number:{base:"must be a number",min:"must be larger than or equal to {{limit}}",max:"must be less than or equal to {{limit}}",less:"must be less than {{limit}}",greater:"must be greater than {{limit}}","float":"must be a float or double",integer:"must be an integer",negative:"must be a negative number",positive:"must be a positive number",precision:"must have no more than {{limit}} decimal places",ref:'references "{{ref}}" which is not a number',multiple:"must be a multiple of {{multiple}}"},string:{base:"must be a string",min:"length must be at least {{limit}} characters long",max:"length must be less than or equal to {{limit}} characters long",length:"length must be {{limit}} characters long",alphanum:"must only contain alpha-numeric characters",token:"must only contain alpha-numeric and underscore characters",regex:{base:'with value "{{!value}}" fails to match the required pattern: {{pattern}}',name:'with value "{{!value}}" fails to match the {{name}} pattern'},email:"must be a valid email",uri:"must be a valid uri",uriCustomScheme:"must be a valid uri with a scheme matching the {{scheme}} pattern",isoDate:"must be a valid ISO 8601 date",guid:"must be a valid GUID",hex:"must only contain hexadecimal characters",hostname:"must be a valid hostname",lowercase:"must only contain lowercase characters",uppercase:"must only contain uppercase characters",trim:"must not have leading or trailing whitespace",creditCard:"must be a credit card",ref:'references "{{ref}}" which is not a number',ip:"must be a valid ip address with a {{cidr}} CIDR",ipVersion:"must be a valid ip address of one of the following versions {{version}} with a {{cidr}} CIDR"}};
},{}],10:[function(require,module,exports){
'use strict';

// Load modules

const Any = require('./any');
const Ref = require('./ref');
const Errors = require('./errors');
const Hoek = require('hoek');


// Declare internals

const internals = {};


internals.Number = function () {

    Any.call(this);
    this._type = 'number';
    this._invalids.add(Infinity);
    this._invalids.add(-Infinity);
};

Hoek.inherits(internals.Number, Any);

internals.compare = function (type, compare) {

    return function (limit) {

        const isRef = Ref.isRef(limit);
        const isNumber = typeof limit === 'number' && !isNaN(limit);

        Hoek.assert(isNumber || isRef, 'limit must be a number or reference');

        return this._test(type, limit, (value, state, options) => {

            let compareTo;
            if (isRef) {
                compareTo = limit(state.parent, options);

                if (!(typeof compareTo === 'number' && !isNaN(compareTo))) {
                    return Errors.create('number.ref', { ref: limit.key }, state, options);
                }
            }
            else {
                compareTo = limit;
            }

            if (compare(value, compareTo)) {
                return null;
            }

            return Errors.create('number.' + type, { limit: compareTo, value: value }, state, options);
        });
    };
};


internals.Number.prototype._base = function (value, state, options) {

    const result = {
        errors: null,
        value: value
    };

    if (typeof value === 'string' &&
        options.convert) {

        const number = parseFloat(value);
        result.value = (isNaN(number) || !isFinite(value)) ? NaN : number;
    }

    const isNumber = typeof result.value === 'number' && !isNaN(result.value);

    if (options.convert && 'precision' in this._flags && isNumber) {

        // This is conceptually equivalent to using toFixed but it should be much faster
        const precision = Math.pow(10, this._flags.precision);
        result.value = Math.round(result.value * precision) / precision;
    }

    result.errors = isNumber ? null : Errors.create('number.base', null, state, options);
    return result;
};


internals.Number.prototype.min = internals.compare('min', (value, limit) => value >= limit);
internals.Number.prototype.max = internals.compare('max', (value, limit) => value <= limit);
internals.Number.prototype.greater = internals.compare('greater', (value, limit) => value > limit);
internals.Number.prototype.less = internals.compare('less', (value, limit) => value < limit);


internals.Number.prototype.multiple = function (base) {

    Hoek.assert(Hoek.isInteger(base), 'multiple must be an integer');
    Hoek.assert(base > 0, 'multiple must be greater than 0');

    return this._test('multiple', base, (value, state, options) => {

        if (value % base === 0) {
            return null;
        }

        return Errors.create('number.multiple', { multiple: base, value: value }, state, options);
    });
};


internals.Number.prototype.integer = function () {

    return this._test('integer', undefined, (value, state, options) => {

        return Hoek.isInteger(value) ? null : Errors.create('number.integer', { value: value }, state, options);
    });
};


internals.Number.prototype.negative = function () {

    return this._test('negative', undefined, (value, state, options) => {

        if (value < 0) {
            return null;
        }

        return Errors.create('number.negative', { value: value }, state, options);
    });
};


internals.Number.prototype.positive = function () {

    return this._test('positive', undefined, (value, state, options) => {

        if (value > 0) {
            return null;
        }

        return Errors.create('number.positive', { value: value }, state, options);
    });
};


internals.precisionRx = /(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/;


internals.Number.prototype.precision = function (limit) {

    Hoek.assert(Hoek.isInteger(limit), 'limit must be an integer');
    Hoek.assert(!('precision' in this._flags), 'precision already set');

    const obj = this._test('precision', limit, (value, state, options) => {

        const places = value.toString().match(internals.precisionRx);
        const decimals = Math.max((places[1] ? places[1].length : 0) - (places[2] ? parseInt(places[2], 10) : 0), 0);
        if (decimals <= limit) {
            return null;
        }

        return Errors.create('number.precision', { limit: limit, value: value }, state, options);
    });

    obj._flags.precision = limit;
    return obj;
};


module.exports = new internals.Number();

},{"./any":2,"./errors":7,"./ref":12,"hoek":18}],11:[function(require,module,exports){
'use strict';

// Load modules

const Hoek = require('hoek');
const Topo = require('topo');
const Any = require('./any');
const Cast = require('./cast');
const Errors = require('./errors');


// Declare internals

const internals = {};


internals.Object = function () {

    Any.call(this);
    this._type = 'object';
    this._inner.children = null;
    this._inner.renames = [];
    this._inner.dependencies = [];
    this._inner.patterns = [];
};

Hoek.inherits(internals.Object, Any);


internals.Object.prototype._base = function (value, state, options) {

    let target = value;
    const errors = [];
    const finish = () => {

        return {
            value: target,
            errors: errors.length ? errors : null
        };
    };

    if (typeof value === 'string' &&
        options.convert) {

        try {
            value = JSON.parse(value);
        }
        catch (parseErr) { }
    }

    const type = this._flags.func ? 'function' : 'object';
    if (!value ||
        typeof value !== type ||
        Array.isArray(value)) {

        errors.push(Errors.create(type + '.base', null, state, options));
        return finish();
    }

    // Skip if there are no other rules to test

    if (!this._inner.renames.length &&
        !this._inner.dependencies.length &&
        !this._inner.children &&                    // null allows any keys
        !this._inner.patterns.length) {

        target = value;
        return finish();
    }

    // Ensure target is a local copy (parsed) or shallow copy

    if (target === value) {
        if (type === 'object') {
            target = Object.create(Object.getPrototypeOf(value));
        }
        else {
            target = function () {

                return value.apply(this, arguments);
            };

            target.prototype = Hoek.clone(value.prototype);
        }

        const valueKeys = Object.keys(value);
        for (let i = 0; i < valueKeys.length; ++i) {
            target[valueKeys[i]] = value[valueKeys[i]];
        }
    }
    else {
        target = value;
    }

    // Rename keys

    const renamed = {};
    for (let i = 0; i < this._inner.renames.length; ++i) {
        const item = this._inner.renames[i];

        if (item.options.ignoreUndefined && target[item.from] === undefined) {
            continue;
        }

        if (!item.options.multiple &&
            renamed[item.to]) {

            errors.push(Errors.create('object.rename.multiple', { from: item.from, to: item.to }, state, options));
            if (options.abortEarly) {
                return finish();
            }
        }

        if (Object.prototype.hasOwnProperty.call(target, item.to) &&
            !item.options.override &&
            !renamed[item.to]) {

            errors.push(Errors.create('object.rename.override', { from: item.from, to: item.to }, state, options));
            if (options.abortEarly) {
                return finish();
            }
        }

        if (target[item.from] === undefined) {
            delete target[item.to];
        }
        else {
            target[item.to] = target[item.from];
        }

        renamed[item.to] = true;

        if (!item.options.alias) {
            delete target[item.from];
        }
    }

    // Validate schema

    if (!this._inner.children &&            // null allows any keys
        !this._inner.patterns.length &&
        !this._inner.dependencies.length) {

        return finish();
    }

    const unprocessed = Hoek.mapToObject(Object.keys(target));

    if (this._inner.children) {
        for (let i = 0; i < this._inner.children.length; ++i) {
            const child = this._inner.children[i];
            const key = child.key;
            const item = target[key];

            delete unprocessed[key];

            const localState = { key: key, path: (state.path || '') + (state.path && key ? '.' : '') + key, parent: target, reference: state.reference };
            const result = child.schema._validate(item, localState, options);
            if (result.errors) {
                errors.push(Errors.create('object.child', { key: key, reason: result.errors }, localState, options));

                if (options.abortEarly) {
                    return finish();
                }
            }

            if (child.schema._flags.strip || (result.value === undefined && result.value !== item)) {
                delete target[key];
            }
            else if (result.value !== undefined) {
                target[key] = result.value;
            }
        }
    }

    // Unknown keys

    let unprocessedKeys = Object.keys(unprocessed);
    if (unprocessedKeys.length &&
        this._inner.patterns.length) {

        for (let i = 0; i < unprocessedKeys.length; ++i) {
            const key = unprocessedKeys[i];

            for (let j = 0; j < this._inner.patterns.length; ++j) {
                const pattern = this._inner.patterns[j];

                if (pattern.regex.test(key)) {
                    delete unprocessed[key];

                    const item = target[key];
                    const localState = { key: key, path: (state.path ? state.path + '.' : '') + key, parent: target, reference: state.reference };
                    const result = pattern.rule._validate(item, localState, options);
                    if (result.errors) {
                        errors.push(Errors.create('object.child', { key: key, reason: result.errors }, localState, options));

                        if (options.abortEarly) {
                            return finish();
                        }
                    }

                    if (result.value !== undefined) {
                        target[key] = result.value;
                    }
                }
            }
        }

        unprocessedKeys = Object.keys(unprocessed);
    }

    if ((this._inner.children || this._inner.patterns.length) && unprocessedKeys.length) {
        if (options.stripUnknown ||
            options.skipFunctions) {

            for (let i = 0; i < unprocessedKeys.length; ++i) {
                const key = unprocessedKeys[i];

                if (options.stripUnknown) {
                    delete target[key];
                    delete unprocessed[key];
                }
                else if (typeof target[key] === 'function') {
                    delete unprocessed[key];
                }
            }

            unprocessedKeys = Object.keys(unprocessed);
        }

        if (unprocessedKeys.length &&
            (this._flags.allowUnknown !== undefined ? !this._flags.allowUnknown : !options.allowUnknown)) {

            for (let i = 0; i < unprocessedKeys.length; ++i) {
                errors.push(Errors.create('object.allowUnknown', null, { key: unprocessedKeys[i], path: state.path + (state.path ? '.' : '') + unprocessedKeys[i] }, options));
            }
        }
    }

    // Validate dependencies

    for (let i = 0; i < this._inner.dependencies.length; ++i) {
        const dep = this._inner.dependencies[i];
        const err = internals[dep.type](dep.key !== null && value[dep.key], dep.peers, target, { key: dep.key, path: (state.path || '') + (dep.key ? '.' + dep.key : '') }, options);
        if (err) {
            errors.push(err);
            if (options.abortEarly) {
                return finish();
            }
        }
    }

    return finish();
};


internals.Object.prototype._func = function () {

    const obj = this.clone();
    obj._flags.func = true;
    return obj;
};


internals.Object.prototype.keys = function (schema) {

    Hoek.assert(schema === null || schema === undefined || typeof schema === 'object', 'Object schema must be a valid object');
    Hoek.assert(!schema || !schema.isJoi, 'Object schema cannot be a joi schema');

    const obj = this.clone();

    if (!schema) {
        obj._inner.children = null;
        return obj;
    }

    const children = Object.keys(schema);

    if (!children.length) {
        obj._inner.children = [];
        return obj;
    }

    const topo = new Topo();
    if (obj._inner.children) {
        for (let i = 0; i < obj._inner.children.length; ++i) {
            const child = obj._inner.children[i];

            // Only add the key if we are not going to replace it later
            if (children.indexOf(child.key) === -1) {
                topo.add(child, { after: child._refs, group: child.key });
            }
        }
    }

    for (let i = 0; i < children.length; ++i) {
        const key = children[i];
        const child = schema[key];
        try {
            const cast = Cast.schema(child);
            topo.add({ key: key, schema: cast }, { after: cast._refs, group: key });
        }
        catch (castErr) {
            if (castErr.hasOwnProperty('path')) {
                castErr.path = key + '.' + castErr.path;
            }
            else {
                castErr.path = key;
            }
            throw castErr;
        }
    }

    obj._inner.children = topo.nodes;

    return obj;
};


internals.Object.prototype.unknown = function (allow) {

    const obj = this.clone();
    obj._flags.allowUnknown = (allow !== false);
    return obj;
};


internals.Object.prototype.length = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('length', limit, (value, state, options) => {

        if (Object.keys(value).length === limit) {
            return null;
        }

        return Errors.create('object.length', { limit: limit }, state, options);
    });
};


internals.Object.prototype.min = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('min', limit, (value, state, options) => {

        if (Object.keys(value).length >= limit) {
            return null;
        }

        return Errors.create('object.min', { limit: limit }, state, options);
    });
};


internals.Object.prototype.max = function (limit) {

    Hoek.assert(Hoek.isInteger(limit) && limit >= 0, 'limit must be a positive integer');

    return this._test('max', limit, (value, state, options) => {

        if (Object.keys(value).length <= limit) {
            return null;
        }

        return Errors.create('object.max', { limit: limit }, state, options);
    });
};


internals.Object.prototype.pattern = function (pattern, schema) {

    Hoek.assert(pattern instanceof RegExp, 'Invalid regular expression');
    Hoek.assert(schema !== undefined, 'Invalid rule');

    pattern = new RegExp(pattern.source, pattern.ignoreCase ? 'i' : undefined);         // Future version should break this and forbid unsupported regex flags

    try {
        schema = Cast.schema(schema);
    }
    catch (castErr) {
        if (castErr.hasOwnProperty('path')) {
            castErr.message = castErr.message + '(' + castErr.path + ')';
        }

        throw castErr;
    }


    const obj = this.clone();
    obj._inner.patterns.push({ regex: pattern, rule: schema });
    return obj;
};


internals.Object.prototype.with = function (key, peers) {

    return this._dependency('with', key, peers);
};


internals.Object.prototype.without = function (key, peers) {

    return this._dependency('without', key, peers);
};


internals.Object.prototype.xor = function () {

    const peers = Hoek.flatten(Array.prototype.slice.call(arguments));
    return this._dependency('xor', null, peers);
};


internals.Object.prototype.or = function () {

    const peers = Hoek.flatten(Array.prototype.slice.call(arguments));
    return this._dependency('or', null, peers);
};


internals.Object.prototype.and = function () {

    const peers = Hoek.flatten(Array.prototype.slice.call(arguments));
    return this._dependency('and', null, peers);
};


internals.Object.prototype.nand = function () {

    const peers = Hoek.flatten(Array.prototype.slice.call(arguments));
    return this._dependency('nand', null, peers);
};


internals.Object.prototype.requiredKeys = function (children) {

    children = Hoek.flatten(Array.prototype.slice.call(arguments));
    return this.applyFunctionToChildren(children, 'required');
};


internals.Object.prototype.optionalKeys = function (children) {

    children = Hoek.flatten(Array.prototype.slice.call(arguments));
    return this.applyFunctionToChildren(children, 'optional');
};


internals.renameDefaults = {
    alias: false,                   // Keep old value in place
    multiple: false,                // Allow renaming multiple keys into the same target
    override: false                 // Overrides an existing key
};


internals.Object.prototype.rename = function (from, to, options) {

    Hoek.assert(typeof from === 'string', 'Rename missing the from argument');
    Hoek.assert(typeof to === 'string', 'Rename missing the to argument');
    Hoek.assert(to !== from, 'Cannot rename key to same name:', from);

    for (let i = 0; i < this._inner.renames.length; ++i) {
        Hoek.assert(this._inner.renames[i].from !== from, 'Cannot rename the same key multiple times');
    }

    const obj = this.clone();

    obj._inner.renames.push({
        from: from,
        to: to,
        options: Hoek.applyToDefaults(internals.renameDefaults, options || {})
    });

    return obj;
};


internals.groupChildren = function (children) {

    children.sort();

    const grouped = {};

    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        Hoek.assert(typeof child === 'string', 'children must be strings');
        const group = child.split('.')[0];
        const childGroup = grouped[group] = (grouped[group] || []);
        childGroup.push(child.substring(group.length + 1));
    }

    return grouped;
};


internals.Object.prototype.applyFunctionToChildren = function (children, fn, args, root) {

    children = [].concat(children);
    Hoek.assert(children.length > 0, 'expected at least one children');

    const groupedChildren = internals.groupChildren(children);
    let obj;

    if ('' in groupedChildren) {
        obj = this[fn].apply(this, args);
        delete groupedChildren[''];
    }
    else {
        obj = this.clone();
    }

    if (obj._inner.children) {
        root = root ? (root + '.') : '';

        for (let i = 0; i < obj._inner.children.length; ++i) {
            const child = obj._inner.children[i];
            const group = groupedChildren[child.key];

            if (group) {
                obj._inner.children[i] = {
                    key: child.key,
                    _refs: child._refs,
                    schema: child.schema.applyFunctionToChildren(group, fn, args, root + child.key)
                };

                delete groupedChildren[child.key];
            }
        }
    }

    const remaining = Object.keys(groupedChildren);
    Hoek.assert(remaining.length === 0, 'unknown key(s)', remaining.join(', '));

    return obj;
};


internals.Object.prototype._dependency = function (type, key, peers) {

    peers = [].concat(peers);
    for (let i = 0; i < peers.length; i++) {
        Hoek.assert(typeof peers[i] === 'string', type, 'peers must be a string or array of strings');
    }

    const obj = this.clone();
    obj._inner.dependencies.push({ type: type, key: key, peers: peers });
    return obj;
};


internals.with = function (value, peers, parent, state, options) {

    if (value === undefined) {
        return null;
    }

    for (let i = 0; i < peers.length; ++i) {
        const peer = peers[i];
        if (!Object.prototype.hasOwnProperty.call(parent, peer) ||
            parent[peer] === undefined) {

            return Errors.create('object.with', { peer: peer }, state, options);
        }
    }

    return null;
};


internals.without = function (value, peers, parent, state, options) {

    if (value === undefined) {
        return null;
    }

    for (let i = 0; i < peers.length; ++i) {
        const peer = peers[i];
        if (Object.prototype.hasOwnProperty.call(parent, peer) &&
            parent[peer] !== undefined) {

            return Errors.create('object.without', { peer: peer }, state, options);
        }
    }

    return null;
};


internals.xor = function (value, peers, parent, state, options) {

    const present = [];
    for (let i = 0; i < peers.length; ++i) {
        const peer = peers[i];
        if (Object.prototype.hasOwnProperty.call(parent, peer) &&
            parent[peer] !== undefined) {

            present.push(peer);
        }
    }

    if (present.length === 1) {
        return null;
    }

    if (present.length === 0) {
        return Errors.create('object.missing', { peers: peers }, state, options);
    }

    return Errors.create('object.xor', { peers: peers }, state, options);
};


internals.or = function (value, peers, parent, state, options) {

    for (let i = 0; i < peers.length; ++i) {
        const peer = peers[i];
        if (Object.prototype.hasOwnProperty.call(parent, peer) &&
            parent[peer] !== undefined) {
            return null;
        }
    }

    return Errors.create('object.missing', { peers: peers }, state, options);
};


internals.and = function (value, peers, parent, state, options) {

    const missing = [];
    const present = [];
    const count = peers.length;
    for (let i = 0; i < count; ++i) {
        const peer = peers[i];
        if (!Object.prototype.hasOwnProperty.call(parent, peer) ||
            parent[peer] === undefined) {

            missing.push(peer);
        }
        else {
            present.push(peer);
        }
    }

    const aon = (missing.length === count || present.length === count);
    return !aon ? Errors.create('object.and', { present: present, missing: missing }, state, options) : null;
};


internals.nand = function (value, peers, parent, state, options) {

    const present = [];
    for (let i = 0; i < peers.length; ++i) {
        const peer = peers[i];
        if (Object.prototype.hasOwnProperty.call(parent, peer) &&
            parent[peer] !== undefined) {

            present.push(peer);
        }
    }

    const values = Hoek.clone(peers);
    const main = values.splice(0, 1)[0];
    const allPresent = (present.length === peers.length);
    return allPresent ? Errors.create('object.nand', { main: main, peers: values }, state, options) : null;
};


internals.Object.prototype.describe = function (shallow) {

    const description = Any.prototype.describe.call(this);

    if (this._inner.children &&
        !shallow) {

        description.children = {};
        for (let i = 0; i < this._inner.children.length; ++i) {
            const child = this._inner.children[i];
            description.children[child.key] = child.schema.describe();
        }
    }

    if (this._inner.dependencies.length) {
        description.dependencies = Hoek.clone(this._inner.dependencies);
    }

    if (this._inner.patterns.length) {
        description.patterns = [];

        for (let i = 0; i < this._inner.patterns.length; ++i) {
            const pattern = this._inner.patterns[i];
            description.patterns.push({ regex: pattern.regex.toString(), rule: pattern.rule.describe() });
        }
    }

    return description;
};


internals.Object.prototype.assert = function (ref, schema, message) {

    ref = Cast.ref(ref);
    Hoek.assert(ref.isContext || ref.depth > 1, 'Cannot use assertions for root level references - use direct key rules instead');
    message = message || 'pass the assertion test';

    let cast;
    try {
        cast = Cast.schema(schema);
    }
    catch (castErr) {
        if (castErr.hasOwnProperty('path')) {
            castErr.message = castErr.message + '(' + castErr.path + ')';
        }

        throw castErr;
    }

    const key = ref.path[ref.path.length - 1];
    const path = ref.path.join('.');

    return this._test('assert', { cast: cast, ref: ref }, (value, state, options) => {

        const result = cast._validate(ref(value), null, options, value);
        if (!result.errors) {
            return null;
        }

        const localState = Hoek.merge({}, state);
        localState.key = key;
        localState.path = path;
        return Errors.create('object.assert', { ref: localState.path, message: message }, localState, options);
    });
};


internals.Object.prototype.type = function (constructor, name) {

    Hoek.assert(typeof constructor === 'function', 'type must be a constructor function');
    name = name || constructor.name;

    return this._test('type', name, (value, state, options) => {

        if (value instanceof constructor) {
            return null;
        }

        return Errors.create('object.type', { type: name }, state, options);
    });
};


module.exports = new internals.Object();

},{"./any":2,"./cast":5,"./errors":7,"hoek":18,"topo":19}],12:[function(require,module,exports){
"use strict";const Hoek=require("hoek"),internals={};exports.create=function(t,e){Hoek.assert("string"==typeof t,"Invalid reference key:",t);const o=Hoek.clone(e),n=function(t,e){return Hoek.reach(n.isContext?e.context:t,n.key,o)};return n.isContext=t[0]===(o&&o.contextPrefix||"$"),n.key=n.isContext?t.slice(1):t,n.path=n.key.split(o&&o.separator||"."),n.depth=n.path.length,n.root=n.path[0],n.isJoi=!0,n.toString=function(){return(n.isContext?"context:":"ref:")+n.key},n},exports.isRef=function(t){return"function"==typeof t&&t.isJoi},exports.push=function(t,e){exports.isRef(e)&&!e.isContext&&t.push(e.root)};
},{"hoek":18}],13:[function(require,module,exports){
(function (Buffer){
'use strict';

// Load modules

const Net = require('net');
const Hoek = require('hoek');
const Isemail = require('isemail');
const Any = require('./any');
const Ref = require('./ref');
const JoiDate = require('./date');
const Errors = require('./errors');
const Uri = require('./string/uri');
const Ip = require('./string/ip');

// Declare internals

const internals = {
    uriRegex: Uri.createUriRegex(),
    ipRegex: Ip.createIpRegex(['ipv4', 'ipv6', 'ipvfuture'], 'optional')
};

internals.String = function () {

    Any.call(this);
    this._type = 'string';
    this._invalids.add('');
};

Hoek.inherits(internals.String, Any);

internals.compare = function (type, compare) {

    return function (limit, encoding) {

        const isRef = Ref.isRef(limit);

        Hoek.assert((Hoek.isInteger(limit) && limit >= 0) || isRef, 'limit must be a positive integer or reference');
        Hoek.assert(!encoding || Buffer.isEncoding(encoding), 'Invalid encoding:', encoding);

        return this._test(type, limit, (value, state, options) => {

            let compareTo;
            if (isRef) {
                compareTo = limit(state.parent, options);

                if (!Hoek.isInteger(compareTo)) {
                    return Errors.create('string.ref', { ref: limit.key }, state, options);
                }
            }
            else {
                compareTo = limit;
            }

            if (compare(value, compareTo, encoding)) {
                return null;
            }

            return Errors.create('string.' + type, { limit: compareTo, value: value, encoding: encoding }, state, options);
        });
    };
};

internals.String.prototype._base = function (value, state, options) {

    if (typeof value === 'string' &&
        options.convert) {

        if (this._flags.case) {
            value = (this._flags.case === 'upper' ? value.toLocaleUpperCase() : value.toLocaleLowerCase());
        }

        if (this._flags.trim) {
            value = value.trim();
        }

        if (this._inner.replacements) {

            for (let i = 0; i < this._inner.replacements.length; ++i) {
                const replacement = this._inner.replacements[i];
                value = value.replace(replacement.pattern, replacement.replacement);
            }
        }
    }

    return {
        value: value,
        errors: (typeof value === 'string') ? null : Errors.create('string.base', { value: value }, state, options)
    };
};


internals.String.prototype.insensitive = function () {

    const obj = this.clone();
    obj._flags.insensitive = true;
    return obj;
};


internals.String.prototype.min = internals.compare('min', (value, limit, encoding) => {

    const length = encoding ? Buffer.byteLength(value, encoding) : value.length;
    return length >= limit;
});


internals.String.prototype.max = internals.compare('max', (value, limit, encoding) => {

    const length = encoding ? Buffer.byteLength(value, encoding) : value.length;
    return length <= limit;
});


internals.String.prototype.creditCard = function () {

    return this._test('creditCard', undefined, (value, state, options) => {

        let i = value.length;
        let sum = 0;
        let mul = 1;

        while (i--) {
            const char = value.charAt(i) * mul;
            sum = sum + (char - (char > 9) * 9);
            mul = mul ^ 3;
        }

        const check = (sum % 10 === 0) && (sum > 0);
        return check ? null : Errors.create('string.creditCard', { value: value }, state, options);
    });
};

internals.String.prototype.length = internals.compare('length', (value, limit, encoding) => {

    const length = encoding ? Buffer.byteLength(value, encoding) : value.length;
    return length === limit;
});


internals.String.prototype.regex = function (pattern, name) {

    Hoek.assert(pattern instanceof RegExp, 'pattern must be a RegExp');

    pattern = new RegExp(pattern.source, pattern.ignoreCase ? 'i' : undefined);         // Future version should break this and forbid unsupported regex flags

    return this._test('regex', pattern, (value, state, options) => {

        if (pattern.test(value)) {
            return null;
        }

        return Errors.create((name ? 'string.regex.name' : 'string.regex.base'), { name: name, pattern: pattern, value: value }, state, options);
    });
};


internals.String.prototype.alphanum = function () {

    return this._test('alphanum', undefined, (value, state, options) => {

        if (/^[a-zA-Z0-9]+$/.test(value)) {
            return null;
        }

        return Errors.create('string.alphanum', { value: value }, state, options);
    });
};


internals.String.prototype.token = function () {

    return this._test('token', undefined, (value, state, options) => {

        if (/^\w+$/.test(value)) {
            return null;
        }

        return Errors.create('string.token', { value: value }, state, options);
    });
};


internals.String.prototype.email = function (isEmailOptions) {

    if (isEmailOptions) {
        Hoek.assert(typeof isEmailOptions === 'object', 'email options must be an object');
        Hoek.assert(typeof isEmailOptions.checkDNS === 'undefined', 'checkDNS option is not supported');
        Hoek.assert(typeof isEmailOptions.tldWhitelist === 'undefined' ||
            typeof isEmailOptions.tldWhitelist === 'object', 'tldWhitelist must be an array or object');
        Hoek.assert(typeof isEmailOptions.minDomainAtoms === 'undefined' ||
            Hoek.isInteger(isEmailOptions.minDomainAtoms) && isEmailOptions.minDomainAtoms > 0,
            'minDomainAtoms must be a positive integer');
        Hoek.assert(typeof isEmailOptions.errorLevel === 'undefined' || typeof isEmailOptions.errorLevel === 'boolean' ||
            (Hoek.isInteger(isEmailOptions.errorLevel) && isEmailOptions.errorLevel >= 0),
            'errorLevel must be a non-negative integer or boolean');
    }

    return this._test('email', isEmailOptions, (value, state, options) => {

        try {
            const result = Isemail.validate(value, isEmailOptions);
            if (result === true || result === 0) {
                return null;
            }
        }
        catch (e) { }

        return Errors.create('string.email', { value: value }, state, options);
    });
};


internals.String.prototype.ip = function (ipOptions) {

    let regex = internals.ipRegex;
    ipOptions = ipOptions || {};
    Hoek.assert(typeof ipOptions === 'object', 'options must be an object');

    if (ipOptions.cidr) {
        Hoek.assert(typeof ipOptions.cidr === 'string', 'cidr must be a string');
        ipOptions.cidr = ipOptions.cidr.toLowerCase();

        Hoek.assert(ipOptions.cidr in Ip.cidrs, 'cidr must be one of ' + Object.keys(Ip.cidrs).join(', '));

        // If we only received a `cidr` setting, create a regex for it. But we don't need to create one if `cidr` is "optional" since that is the default
        if (!ipOptions.version && ipOptions.cidr !== 'optional') {
            regex = Ip.createIpRegex(['ipv4', 'ipv6', 'ipvfuture'], ipOptions.cidr);
        }
    }
    else {

        // Set our default cidr strategy
        ipOptions.cidr = 'optional';
    }

    let versions;
    if (ipOptions.version) {
        if (!Array.isArray(ipOptions.version)) {
            ipOptions.version = [ipOptions.version];
        }

        Hoek.assert(ipOptions.version.length >= 1, 'version must have at least 1 version specified');

        versions = [];
        for (let i = 0; i < ipOptions.version.length; ++i) {
            let version = ipOptions.version[i];
            Hoek.assert(typeof version === 'string', 'version at position ' + i + ' must be a string');
            version = version.toLowerCase();
            Hoek.assert(Ip.versions[version], 'version at position ' + i + ' must be one of ' + Object.keys(Ip.versions).join(', '));
            versions.push(version);
        }

        // Make sure we have a set of versions
        versions = Hoek.unique(versions);

        regex = Ip.createIpRegex(versions, ipOptions.cidr);
    }

    return this._test('ip', ipOptions, (value, state, options) => {

        if (regex.test(value)) {
            return null;
        }

        if (versions) {
            return Errors.create('string.ipVersion', { value: value, cidr: ipOptions.cidr, version: versions }, state, options);
        }

        return Errors.create('string.ip', { value: value, cidr: ipOptions.cidr }, state, options);
    });
};


internals.String.prototype.uri = function (uriOptions) {

    let customScheme = '';
    let regex = internals.uriRegex;

    if (uriOptions) {
        Hoek.assert(typeof uriOptions === 'object', 'options must be an object');

        if (uriOptions.scheme) {
            Hoek.assert(uriOptions.scheme instanceof RegExp || typeof uriOptions.scheme === 'string' || Array.isArray(uriOptions.scheme), 'scheme must be a RegExp, String, or Array');

            if (!Array.isArray(uriOptions.scheme)) {
                uriOptions.scheme = [uriOptions.scheme];
            }

            Hoek.assert(uriOptions.scheme.length >= 1, 'scheme must have at least 1 scheme specified');

            // Flatten the array into a string to be used to match the schemes.
            for (let i = 0; i < uriOptions.scheme.length; ++i) {
                const scheme = uriOptions.scheme[i];
                Hoek.assert(scheme instanceof RegExp || typeof scheme === 'string', 'scheme at position ' + i + ' must be a RegExp or String');

                // Add OR separators if a value already exists
                customScheme = customScheme + (customScheme ? '|' : '');

                // If someone wants to match HTTP or HTTPS for example then we need to support both RegExp and String so we don't escape their pattern unknowingly.
                if (scheme instanceof RegExp) {
                    customScheme = customScheme + scheme.source;
                }
                else {
                    Hoek.assert(/[a-zA-Z][a-zA-Z0-9+-\.]*/.test(scheme), 'scheme at position ' + i + ' must be a valid scheme');
                    customScheme = customScheme + Hoek.escapeRegex(scheme);
                }
            }
        }
    }

    if (customScheme) {
        regex = Uri.createUriRegex(customScheme);
    }

    return this._test('uri', uriOptions, (value, state, options) => {

        if (regex.test(value)) {
            return null;
        }

        if (customScheme) {
            return Errors.create('string.uriCustomScheme', { scheme: customScheme, value: value }, state, options);
        }

        return Errors.create('string.uri', { value: value }, state, options);
    });
};


internals.String.prototype.isoDate = function () {

    return this._test('isoDate', undefined, (value, state, options) => {

        if (JoiDate._isIsoDate(value)) {
            return null;
        }

        return Errors.create('string.isoDate', { value: value }, state, options);
    });
};


internals.String.prototype.guid = function () {

    const regex = /^[A-F0-9]{8}(?:-?[A-F0-9]{4}){3}-?[A-F0-9]{12}$/i;
    const regex2 = /^\{[A-F0-9]{8}(?:-?[A-F0-9]{4}){3}-?[A-F0-9]{12}\}$/i;

    return this._test('guid', undefined, (value, state, options) => {

        if (regex.test(value) || regex2.test(value)) {
            return null;
        }

        return Errors.create('string.guid', { value: value }, state, options);
    });
};


internals.String.prototype.hex = function () {

    const regex = /^[a-f0-9]+$/i;

    return this._test('hex', regex, (value, state, options) => {

        if (regex.test(value)) {
            return null;
        }

        return Errors.create('string.hex', { value: value }, state, options);
    });
};


internals.String.prototype.hostname = function () {

    const regex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

    return this._test('hostname', undefined, (value, state, options) => {

        if ((value.length <= 255 && regex.test(value)) ||
            Net.isIPv6(value)) {

            return null;
        }

        return Errors.create('string.hostname', { value: value }, state, options);
    });
};


internals.String.prototype.lowercase = function () {

    const obj = this._test('lowercase', undefined, (value, state, options) => {

        if (options.convert ||
            value === value.toLocaleLowerCase()) {

            return null;
        }

        return Errors.create('string.lowercase', { value: value }, state, options);
    });

    obj._flags.case = 'lower';
    return obj;
};


internals.String.prototype.uppercase = function () {

    const obj = this._test('uppercase', undefined, (value, state, options) => {

        if (options.convert ||
            value === value.toLocaleUpperCase()) {

            return null;
        }

        return Errors.create('string.uppercase', { value: value }, state, options);
    });

    obj._flags.case = 'upper';
    return obj;
};


internals.String.prototype.trim = function () {

    const obj = this._test('trim', undefined, (value, state, options) => {

        if (options.convert ||
            value === value.trim()) {

            return null;
        }

        return Errors.create('string.trim', { value: value }, state, options);
    });

    obj._flags.trim = true;
    return obj;
};


internals.String.prototype.replace = function (pattern, replacement) {

    if (typeof pattern === 'string') {
        pattern = new RegExp(Hoek.escapeRegex(pattern), 'g');
    }

    Hoek.assert(pattern instanceof RegExp, 'pattern must be a RegExp');
    Hoek.assert(typeof replacement === 'string', 'replacement must be a String');

    // This can not be considere a test like trim, we can't "reject"
    // anything from this rule, so just clone the current object
    const obj = this.clone();

    if (!obj._inner.replacements) {
        obj._inner.replacements = [];
    }

    obj._inner.replacements.push({
        pattern: pattern,
        replacement: replacement
    });

    return obj;
};

module.exports = new internals.String();

}).call(this,require("buffer").Buffer)

},{"./any":2,"./date":6,"./errors":7,"./ref":12,"./string/ip":14,"./string/uri":16,"buffer":"buffer","hoek":18,"isemail":20,"net":20}],14:[function(require,module,exports){
'use strict';

// Load modules

const RFC3986 = require('./rfc3986');


// Declare internals

const internals = {
    Ip: {
        cidrs: {
            required: '\\/(?:' + RFC3986.cidr + ')',
            optional: '(?:\\/(?:' + RFC3986.cidr + '))?',
            forbidden: ''
        },
        versions: {
            ipv4: RFC3986.IPv4address,
            ipv6: RFC3986.IPv6address,
            ipvfuture: RFC3986.IPvFuture
        }
    }
};


internals.Ip.createIpRegex = function (versions, cidr) {

    let regex;
    for (let i = 0; i < versions.length; ++i) {
        const version = versions[i];
        if (!regex) {
            regex = '^(?:' + internals.Ip.versions[version];
        }
        regex = regex + '|' + internals.Ip.versions[version];
    }

    return new RegExp(regex + ')' + internals.Ip.cidrs[cidr] + '$');
};

module.exports = internals.Ip;

},{"./rfc3986":15}],15:[function(require,module,exports){
"use strict";const internals={rfc3986:{}};internals.generate=function(){const r="|";internals.rfc3986.cidr="[0-9]|[1-2][0-9]|3[0-2]";const n="a-zA-Z0-9-\\._~",e="!\\$&'\\(\\)\\*\\+,;=",s="%0-9A-Fa-f",a=n+s+e+":@",t="["+a+"]",c="(?:0?0?[0-9]|0?[1-9][0-9]|1[0-9][0-9]|2[0-4][0-9]|25[0-5])";internals.rfc3986.IPv4address="(?:"+c+"\\.){3}"+c;const i="[0-9A-Fa-f]{1,4}",f="(?:"+i+":"+i+"|"+internals.rfc3986.IPv4address+")",l="(?:"+i+":){6}"+f,d="::(?:"+i+":){5}"+f,o=i+"::(?:"+i+":){4}"+f,u="(?:"+i+":){0,1}"+i+"::(?:"+i+":){3}"+f,v="(?:"+i+":){0,2}"+i+"::(?:"+i+":){2}"+f,P="(?:"+i+":){0,3}"+i+"::"+i+":"+f,I="(?:"+i+":){0,4}"+i+"::"+f,A="(?:"+i+":){0,5}"+i+"::"+i,F="(?:"+i+":){0,6}"+i+"::";internals.rfc3986.IPv6address="(?:"+l+r+d+r+o+r+u+r+v+r+P+r+I+r+A+r+F+")",internals.rfc3986.IPvFuture="v[0-9A-Fa-f]+\\.["+n+e+":]+",internals.rfc3986.scheme="[a-zA-Z][a-zA-Z0-9+-\\.]*";const g="["+n+s+e+":]*",m="\\[(?:"+internals.rfc3986.IPv6address+r+internals.rfc3986.IPvFuture+")\\]",z="["+n+s+e+"]{0,255}",Z="(?:"+m+r+internals.rfc3986.IPv4address+r+z+")",h="[0-9]*",$="(?:"+g+"@)?"+Z+"(?::"+h+")?",p=t+"*",q=t+"+",x="(?:\\/"+p+")*",y="\\/(?:"+q+x+")?",_=q+x;internals.rfc3986.hierPart="(?:\\/\\/"+$+x+r+y+r+_+")",internals.rfc3986.query="["+a+"\\/\\?]*(?=#|$)",internals.rfc3986.fragment="["+a+"\\/\\?]*"},internals.generate(),module.exports=internals.rfc3986;
},{}],16:[function(require,module,exports){
'use strict';

// Load Modules

const RFC3986 = require('./rfc3986');


// Declare internals

const internals = {
    Uri: {
        createUriRegex: function (optionalScheme) {

            let scheme = RFC3986.scheme;

            // If we were passed a scheme, use it instead of the generic one
            if (optionalScheme) {

                // Have to put this in a non-capturing group to handle the OR statements
                scheme = '(?:' + optionalScheme + ')';
            }

            /**
             * URI = scheme ":" hier-part [ "?" query ] [ "#" fragment ]
             */
            return new RegExp('^' + scheme + ':' + RFC3986.hierPart + '(?:\\?' + RFC3986.query + ')?' + '(?:#' + RFC3986.fragment + ')?$');
        }
    }
};


module.exports = internals.Uri;

},{"./rfc3986":15}],17:[function(require,module,exports){
(function (Buffer){
'use strict';

// Declare internals

const internals = {};


exports.escapeJavaScript = function (input) {

    if (!input) {
        return '';
    }

    let escaped = '';

    for (let i = 0; i < input.length; ++i) {

        const charCode = input.charCodeAt(i);

        if (internals.isSafe(charCode)) {
            escaped += input[i];
        }
        else {
            escaped += internals.escapeJavaScriptChar(charCode);
        }
    }

    return escaped;
};


exports.escapeHtml = function (input) {

    if (!input) {
        return '';
    }

    let escaped = '';

    for (let i = 0; i < input.length; ++i) {

        const charCode = input.charCodeAt(i);

        if (internals.isSafe(charCode)) {
            escaped += input[i];
        }
        else {
            escaped += internals.escapeHtmlChar(charCode);
        }
    }

    return escaped;
};


internals.escapeJavaScriptChar = function (charCode) {

    if (charCode >= 256) {
        return '\\u' + internals.padLeft('' + charCode, 4);
    }

    const hexValue = new Buffer(String.fromCharCode(charCode), 'ascii').toString('hex');
    return '\\x' + internals.padLeft(hexValue, 2);
};


internals.escapeHtmlChar = function (charCode) {

    const namedEscape = internals.namedHtml[charCode];
    if (typeof namedEscape !== 'undefined') {
        return namedEscape;
    }

    if (charCode >= 256) {
        return '&#' + charCode + ';';
    }

    const hexValue = new Buffer(String.fromCharCode(charCode), 'ascii').toString('hex');
    return '&#x' + internals.padLeft(hexValue, 2) + ';';
};


internals.padLeft = function (str, len) {

    while (str.length < len) {
        str = '0' + str;
    }

    return str;
};


internals.isSafe = function (charCode) {

    return (typeof internals.safeCharCodes[charCode] !== 'undefined');
};


internals.namedHtml = {
    '38': '&amp;',
    '60': '&lt;',
    '62': '&gt;',
    '34': '&quot;',
    '160': '&nbsp;',
    '162': '&cent;',
    '163': '&pound;',
    '164': '&curren;',
    '169': '&copy;',
    '174': '&reg;'
};


internals.safeCharCodes = (function () {

    const safe = {};

    for (let i = 32; i < 123; ++i) {

        if ((i >= 97) ||                    // a-z
            (i >= 65 && i <= 90) ||         // A-Z
            (i >= 48 && i <= 57) ||         // 0-9
            i === 32 ||                     // space
            i === 46 ||                     // .
            i === 44 ||                     // ,
            i === 45 ||                     // -
            i === 58 ||                     // :
            i === 95) {                     // _

            safe[i] = null;
        }
    }

    return safe;
}());

}).call(this,require("buffer").Buffer)

},{"buffer":"buffer"}],18:[function(require,module,exports){
(function (process,Buffer){
'use strict';

// Load modules

const Crypto = require('crypto');
const Path = require('path');
const Util = require('util');
const Escape = require('./escape');


// Declare internals

const internals = {};


// Clone object or array

exports.clone = function (obj, seen) {

    if (typeof obj !== 'object' ||
        obj === null) {

        return obj;
    }

    seen = seen || { orig: [], copy: [] };

    const lookup = seen.orig.indexOf(obj);
    if (lookup !== -1) {
        return seen.copy[lookup];
    }

    let newObj;
    let cloneDeep = false;

    if (!Array.isArray(obj)) {
        if (Buffer.isBuffer(obj)) {
            newObj = new Buffer(obj);
        }
        else if (obj instanceof Date) {
            newObj = new Date(obj.getTime());
        }
        else if (obj instanceof RegExp) {
            newObj = new RegExp(obj);
        }
        else {
            const proto = Object.getPrototypeOf(obj);
            if (proto &&
                proto.isImmutable) {

                newObj = obj;
            }
            else {
                newObj = Object.create(proto);
                cloneDeep = true;
            }
        }
    }
    else {
        newObj = [];
        cloneDeep = true;
    }

    seen.orig.push(obj);
    seen.copy.push(newObj);

    if (cloneDeep) {
        const keys = Object.getOwnPropertyNames(obj);
        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i];
            const descriptor = Object.getOwnPropertyDescriptor(obj, key);
            if (descriptor &&
                (descriptor.get ||
                 descriptor.set)) {

                Object.defineProperty(newObj, key, descriptor);
            }
            else {
                newObj[key] = exports.clone(obj[key], seen);
            }
        }
    }

    return newObj;
};


// Merge all the properties of source into target, source wins in conflict, and by default null and undefined from source are applied

/*eslint-disable */
exports.merge = function (target, source, isNullOverride /* = true */, isMergeArrays /* = true */) {
/*eslint-enable */

    exports.assert(target && typeof target === 'object', 'Invalid target value: must be an object');
    exports.assert(source === null || source === undefined || typeof source === 'object', 'Invalid source value: must be null, undefined, or an object');

    if (!source) {
        return target;
    }

    if (Array.isArray(source)) {
        exports.assert(Array.isArray(target), 'Cannot merge array onto an object');
        if (isMergeArrays === false) {                                                  // isMergeArrays defaults to true
            target.length = 0;                                                          // Must not change target assignment
        }

        for (let i = 0; i < source.length; ++i) {
            target.push(exports.clone(source[i]));
        }

        return target;
    }

    const keys = Object.keys(source);
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const value = source[key];
        if (value &&
            typeof value === 'object') {

            if (!target[key] ||
                typeof target[key] !== 'object' ||
                (Array.isArray(target[key]) ^ Array.isArray(value)) ||
                value instanceof Date ||
                Buffer.isBuffer(value) ||
                value instanceof RegExp) {

                target[key] = exports.clone(value);
            }
            else {
                exports.merge(target[key], value, isNullOverride, isMergeArrays);
            }
        }
        else {
            if (value !== null &&
                value !== undefined) {                              // Explicit to preserve empty strings

                target[key] = value;
            }
            else if (isNullOverride !== false) {                    // Defaults to true
                target[key] = value;
            }
        }
    }

    return target;
};


// Apply options to a copy of the defaults

exports.applyToDefaults = function (defaults, options, isNullOverride) {

    exports.assert(defaults && typeof defaults === 'object', 'Invalid defaults value: must be an object');
    exports.assert(!options || options === true || typeof options === 'object', 'Invalid options value: must be true, falsy or an object');

    if (!options) {                                                 // If no options, return null
        return null;
    }

    const copy = exports.clone(defaults);

    if (options === true) {                                         // If options is set to true, use defaults
        return copy;
    }

    return exports.merge(copy, options, isNullOverride === true, false);
};


// Clone an object except for the listed keys which are shallow copied

exports.cloneWithShallow = function (source, keys) {

    if (!source ||
        typeof source !== 'object') {

        return source;
    }

    const storage = internals.store(source, keys);    // Move shallow copy items to storage
    const copy = exports.clone(source);               // Deep copy the rest
    internals.restore(copy, source, storage);       // Shallow copy the stored items and restore
    return copy;
};


internals.store = function (source, keys) {

    const storage = {};
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const value = exports.reach(source, key);
        if (value !== undefined) {
            storage[key] = value;
            internals.reachSet(source, key, undefined);
        }
    }

    return storage;
};


internals.restore = function (copy, source, storage) {

    const keys = Object.keys(storage);
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        internals.reachSet(copy, key, storage[key]);
        internals.reachSet(source, key, storage[key]);
    }
};


internals.reachSet = function (obj, key, value) {

    const path = key.split('.');
    let ref = obj;
    for (let i = 0; i < path.length; ++i) {
        const segment = path[i];
        if (i + 1 === path.length) {
            ref[segment] = value;
        }

        ref = ref[segment];
    }
};


// Apply options to defaults except for the listed keys which are shallow copied from option without merging

exports.applyToDefaultsWithShallow = function (defaults, options, keys) {

    exports.assert(defaults && typeof defaults === 'object', 'Invalid defaults value: must be an object');
    exports.assert(!options || options === true || typeof options === 'object', 'Invalid options value: must be true, falsy or an object');
    exports.assert(keys && Array.isArray(keys), 'Invalid keys');

    if (!options) {                                                 // If no options, return null
        return null;
    }

    const copy = exports.cloneWithShallow(defaults, keys);

    if (options === true) {                                         // If options is set to true, use defaults
        return copy;
    }

    const storage = internals.store(options, keys);   // Move shallow copy items to storage
    exports.merge(copy, options, false, false);     // Deep copy the rest
    internals.restore(copy, options, storage);      // Shallow copy the stored items and restore
    return copy;
};


// Deep object or array comparison

exports.deepEqual = function (obj, ref, options, seen) {

    options = options || { prototype: true };

    const type = typeof obj;

    if (type !== typeof ref) {
        return false;
    }

    if (type !== 'object' ||
        obj === null ||
        ref === null) {

        if (obj === ref) {                                                      // Copied from Deep-eql, copyright(c) 2013 Jake Luer, jake@alogicalparadox.com, MIT Licensed, https://github.com/chaijs/deep-eql
            return obj !== 0 || 1 / obj === 1 / ref;        // -0 / +0
        }

        return obj !== obj && ref !== ref;                  // NaN
    }

    seen = seen || [];
    if (seen.indexOf(obj) !== -1) {
        return true;                            // If previous comparison failed, it would have stopped execution
    }

    seen.push(obj);

    if (Array.isArray(obj)) {
        if (!Array.isArray(ref)) {
            return false;
        }

        if (!options.part && obj.length !== ref.length) {
            return false;
        }

        for (let i = 0; i < obj.length; ++i) {
            if (options.part) {
                let found = false;
                for (let j = 0; j < ref.length; ++j) {
                    if (exports.deepEqual(obj[i], ref[j], options)) {
                        found = true;
                        break;
                    }
                }

                return found;
            }

            if (!exports.deepEqual(obj[i], ref[i], options)) {
                return false;
            }
        }

        return true;
    }

    if (Buffer.isBuffer(obj)) {
        if (!Buffer.isBuffer(ref)) {
            return false;
        }

        if (obj.length !== ref.length) {
            return false;
        }

        for (let i = 0; i < obj.length; ++i) {
            if (obj[i] !== ref[i]) {
                return false;
            }
        }

        return true;
    }

    if (obj instanceof Date) {
        return (ref instanceof Date && obj.getTime() === ref.getTime());
    }

    if (obj instanceof RegExp) {
        return (ref instanceof RegExp && obj.toString() === ref.toString());
    }

    if (options.prototype) {
        if (Object.getPrototypeOf(obj) !== Object.getPrototypeOf(ref)) {
            return false;
        }
    }

    const keys = Object.getOwnPropertyNames(obj);

    if (!options.part && keys.length !== Object.getOwnPropertyNames(ref).length) {
        return false;
    }

    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const descriptor = Object.getOwnPropertyDescriptor(obj, key);
        if (descriptor.get) {
            if (!exports.deepEqual(descriptor, Object.getOwnPropertyDescriptor(ref, key), options, seen)) {
                return false;
            }
        }
        else if (!exports.deepEqual(obj[key], ref[key], options, seen)) {
            return false;
        }
    }

    return true;
};


// Remove duplicate items from array

exports.unique = function (array, key) {

    const index = {};
    const result = [];

    for (let i = 0; i < array.length; ++i) {
        const id = (key ? array[i][key] : array[i]);
        if (index[id] !== true) {

            result.push(array[i]);
            index[id] = true;
        }
    }

    return result;
};


// Convert array into object

exports.mapToObject = function (array, key) {

    if (!array) {
        return null;
    }

    const obj = {};
    for (let i = 0; i < array.length; ++i) {
        if (key) {
            if (array[i][key]) {
                obj[array[i][key]] = true;
            }
        }
        else {
            obj[array[i]] = true;
        }
    }

    return obj;
};


// Find the common unique items in two arrays

exports.intersect = function (array1, array2, justFirst) {

    if (!array1 || !array2) {
        return [];
    }

    const common = [];
    const hash = (Array.isArray(array1) ? exports.mapToObject(array1) : array1);
    const found = {};
    for (let i = 0; i < array2.length; ++i) {
        if (hash[array2[i]] && !found[array2[i]]) {
            if (justFirst) {
                return array2[i];
            }

            common.push(array2[i]);
            found[array2[i]] = true;
        }
    }

    return (justFirst ? null : common);
};


// Test if the reference contains the values

exports.contain = function (ref, values, options) {

    /*
        string -> string(s)
        array -> item(s)
        object -> key(s)
        object -> object (key:value)
    */

    let valuePairs = null;
    if (typeof ref === 'object' &&
        typeof values === 'object' &&
        !Array.isArray(ref) &&
        !Array.isArray(values)) {

        valuePairs = values;
        values = Object.keys(values);
    }
    else {
        values = [].concat(values);
    }

    options = options || {};            // deep, once, only, part

    exports.assert(arguments.length >= 2, 'Insufficient arguments');
    exports.assert(typeof ref === 'string' || typeof ref === 'object', 'Reference must be string or an object');
    exports.assert(values.length, 'Values array cannot be empty');

    let compare;
    let compareFlags;
    if (options.deep) {
        compare = exports.deepEqual;

        const hasOnly = options.hasOwnProperty('only');
        const hasPart = options.hasOwnProperty('part');

        compareFlags = {
            prototype: hasOnly ? options.only : hasPart ? !options.part : false,
            part: hasOnly ? !options.only : hasPart ? options.part : true
        };
    }
    else {
        compare = (a, b) => a === b;
    }

    let misses = false;
    const matches = new Array(values.length);
    for (let i = 0; i < matches.length; ++i) {
        matches[i] = 0;
    }

    if (typeof ref === 'string') {
        let pattern = '(';
        for (let i = 0; i < values.length; ++i) {
            const value = values[i];
            exports.assert(typeof value === 'string', 'Cannot compare string reference to non-string value');
            pattern += (i ? '|' : '') + exports.escapeRegex(value);
        }

        const regex = new RegExp(pattern + ')', 'g');
        const leftovers = ref.replace(regex, ($0, $1) => {

            const index = values.indexOf($1);
            ++matches[index];
            return '';          // Remove from string
        });

        misses = !!leftovers;
    }
    else if (Array.isArray(ref)) {
        for (let i = 0; i < ref.length; ++i) {
            let matched = false;
            for (let j = 0; j < values.length && matched === false; ++j) {
                matched = compare(values[j], ref[i], compareFlags) && j;
            }

            if (matched !== false) {
                ++matches[matched];
            }
            else {
                misses = true;
            }
        }
    }
    else {
        const keys = Object.keys(ref);
        for (let i = 0; i < keys.length; ++i) {
            const key = keys[i];
            const pos = values.indexOf(key);
            if (pos !== -1) {
                if (valuePairs &&
                    !compare(valuePairs[key], ref[key], compareFlags)) {

                    return false;
                }

                ++matches[pos];
            }
            else {
                misses = true;
            }
        }
    }

    let result = false;
    for (let i = 0; i < matches.length; ++i) {
        result = result || !!matches[i];
        if ((options.once && matches[i] > 1) ||
            (!options.part && !matches[i])) {

            return false;
        }
    }

    if (options.only &&
        misses) {

        return false;
    }

    return result;
};


// Flatten array

exports.flatten = function (array, target) {

    const result = target || [];

    for (let i = 0; i < array.length; ++i) {
        if (Array.isArray(array[i])) {
            exports.flatten(array[i], result);
        }
        else {
            result.push(array[i]);
        }
    }

    return result;
};


// Convert an object key chain string ('a.b.c') to reference (object[a][b][c])

exports.reach = function (obj, chain, options) {

    if (chain === false ||
        chain === null ||
        typeof chain === 'undefined') {

        return obj;
    }

    options = options || {};
    if (typeof options === 'string') {
        options = { separator: options };
    }

    const path = chain.split(options.separator || '.');
    let ref = obj;
    for (let i = 0; i < path.length; ++i) {
        let key = path[i];
        if (key[0] === '-' && Array.isArray(ref)) {
            key = key.slice(1, key.length);
            key = ref.length - key;
        }

        if (!ref ||
            !((typeof ref === 'object' || typeof ref === 'function') && key in ref) ||
            (typeof ref !== 'object' && options.functions === false)) {         // Only object and function can have properties

            exports.assert(!options.strict || i + 1 === path.length, 'Missing segment', key, 'in reach path ', chain);
            exports.assert(typeof ref === 'object' || options.functions === true || typeof ref !== 'function', 'Invalid segment', key, 'in reach path ', chain);
            ref = options.default;
            break;
        }

        ref = ref[key];
    }

    return ref;
};


exports.reachTemplate = function (obj, template, options) {

    return template.replace(/{([^}]+)}/g, ($0, chain) => {

        const value = exports.reach(obj, chain, options);
        return (value === undefined || value === null ? '' : value);
    });
};


exports.formatStack = function (stack) {

    const trace = [];
    for (let i = 0; i < stack.length; ++i) {
        const item = stack[i];
        trace.push([item.getFileName(), item.getLineNumber(), item.getColumnNumber(), item.getFunctionName(), item.isConstructor()]);
    }

    return trace;
};


exports.formatTrace = function (trace) {

    const display = [];

    for (let i = 0; i < trace.length; ++i) {
        const row = trace[i];
        display.push((row[4] ? 'new ' : '') + row[3] + ' (' + row[0] + ':' + row[1] + ':' + row[2] + ')');
    }

    return display;
};


exports.callStack = function (slice) {

    // http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi

    const v8 = Error.prepareStackTrace;
    Error.prepareStackTrace = function (err, stack) {

        return stack;
    };

    const capture = {};
    Error.captureStackTrace(capture, this);     // arguments.callee is not supported in strict mode so we use this and slice the trace of this off the result
    const stack = capture.stack;

    Error.prepareStackTrace = v8;

    const trace = exports.formatStack(stack);

    return trace.slice(1 + slice);
};


exports.displayStack = function (slice) {

    const trace = exports.callStack(slice === undefined ? 1 : slice + 1);

    return exports.formatTrace(trace);
};


exports.abortThrow = false;


exports.abort = function (message, hideStack) {

    if (process.env.NODE_ENV === 'test' || exports.abortThrow === true) {
        throw new Error(message || 'Unknown error');
    }

    let stack = '';
    if (!hideStack) {
        stack = exports.displayStack(1).join('\n\t');
    }
    console.log('ABORT: ' + message + '\n\t' + stack);
    process.exit(1);
};


exports.assert = function (condition /*, msg1, msg2, msg3 */) {

    if (condition) {
        return;
    }

    if (arguments.length === 2 && arguments[1] instanceof Error) {
        throw arguments[1];
    }

    let msgs = [];
    for (let i = 1; i < arguments.length; ++i) {
        if (arguments[i] !== '') {
            msgs.push(arguments[i]);            // Avoids Array.slice arguments leak, allowing for V8 optimizations
        }
    }

    msgs = msgs.map((msg) => {

        return typeof msg === 'string' ? msg : msg instanceof Error ? msg.message : exports.stringify(msg);
    });

    throw new Error(msgs.join(' ') || 'Unknown error');
};


exports.Timer = function () {

    this.ts = 0;
    this.reset();
};


exports.Timer.prototype.reset = function () {

    this.ts = Date.now();
};


exports.Timer.prototype.elapsed = function () {

    return Date.now() - this.ts;
};


exports.Bench = function () {

    this.ts = 0;
    this.reset();
};


exports.Bench.prototype.reset = function () {

    this.ts = exports.Bench.now();
};


exports.Bench.prototype.elapsed = function () {

    return exports.Bench.now() - this.ts;
};


exports.Bench.now = function () {

    const ts = process.hrtime();
    return (ts[0] * 1e3) + (ts[1] / 1e6);
};


// Escape string for Regex construction

exports.escapeRegex = function (string) {

    // Escape ^$.*+-?=!:|\/()[]{},
    return string.replace(/[\^\$\.\*\+\-\?\=\!\:\|\\\/\(\)\[\]\{\}\,]/g, '\\$&');
};


// Base64url (RFC 4648) encode

exports.base64urlEncode = function (value, encoding) {

    const buf = (Buffer.isBuffer(value) ? value : new Buffer(value, encoding || 'binary'));
    return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/\=/g, '');
};


// Base64url (RFC 4648) decode

exports.base64urlDecode = function (value, encoding) {

    if (value &&
        !/^[\w\-]*$/.test(value)) {

        return new Error('Invalid character');
    }

    try {
        const buf = new Buffer(value, 'base64');
        return (encoding === 'buffer' ? buf : buf.toString(encoding || 'binary'));
    }
    catch (err) {
        return err;
    }
};


// Escape attribute value for use in HTTP header

exports.escapeHeaderAttribute = function (attribute) {

    // Allowed value characters: !#$%&'()*+,-./:;<=>?@[]^_`{|}~ and space, a-z, A-Z, 0-9, \, "

    exports.assert(/^[ \w\!#\$%&'\(\)\*\+,\-\.\/\:;<\=>\?@\[\]\^`\{\|\}~\"\\]*$/.test(attribute), 'Bad attribute value (' + attribute + ')');

    return attribute.replace(/\\/g, '\\\\').replace(/\"/g, '\\"');                             // Escape quotes and slash
};


exports.escapeHtml = function (string) {

    return Escape.escapeHtml(string);
};


exports.escapeJavaScript = function (string) {

    return Escape.escapeJavaScript(string);
};


exports.nextTick = function (callback) {

    return function () {

        const args = arguments;
        process.nextTick(() => {

            callback.apply(null, args);
        });
    };
};


exports.once = function (method) {

    if (method._hoekOnce) {
        return method;
    }

    let once = false;
    const wrapped = function () {

        if (!once) {
            once = true;
            method.apply(null, arguments);
        }
    };

    wrapped._hoekOnce = true;

    return wrapped;
};


exports.isAbsolutePath = function (path, platform) {

    if (!path) {
        return false;
    }

    if (Path.isAbsolute) {                      // node >= 0.11
        return Path.isAbsolute(path);
    }

    platform = platform || process.platform;

    // Unix

    if (platform !== 'win32') {
        return path[0] === '/';
    }

    // Windows

    return !!/^(?:[a-zA-Z]:[\\\/])|(?:[\\\/]{2}[^\\\/]+[\\\/]+[^\\\/])/.test(path);        // C:\ or \\something\something
};


exports.isInteger = function (value) {

    return (typeof value === 'number' &&
            parseFloat(value) === parseInt(value, 10) &&
            !isNaN(value));
};


exports.ignore = function () { };


exports.inherits = Util.inherits;


exports.format = Util.format;


exports.transform = function (source, transform, options) {

    exports.assert(source === null || source === undefined || typeof source === 'object' || Array.isArray(source), 'Invalid source object: must be null, undefined, an object, or an array');

    if (Array.isArray(source)) {
        const results = [];
        for (let i = 0; i < source.length; ++i) {
            results.push(exports.transform(source[i], transform, options));
        }
        return results;
    }

    const result = {};
    const keys = Object.keys(transform);

    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        const path = key.split('.');
        const sourcePath = transform[key];

        exports.assert(typeof sourcePath === 'string', 'All mappings must be "." delineated strings');

        let segment;
        let res = result;

        while (path.length > 1) {
            segment = path.shift();
            if (!res[segment]) {
                res[segment] = {};
            }
            res = res[segment];
        }
        segment = path.shift();
        res[segment] = exports.reach(source, sourcePath, options);
    }

    return result;
};


exports.uniqueFilename = function (path, extension) {

    if (extension) {
        extension = extension[0] !== '.' ? '.' + extension : extension;
    }
    else {
        extension = '';
    }

    path = Path.resolve(path);
    const name = [Date.now(), process.pid, Crypto.randomBytes(8).toString('hex')].join('-') + extension;
    return Path.join(path, name);
};


exports.stringify = function () {

    try {
        return JSON.stringify.apply(null, arguments);
    }
    catch (err) {
        return '[Cannot display object: ' + err.message + ']';
    }
};


exports.shallow = function (source) {

    const target = {};
    const keys = Object.keys(source);
    for (let i = 0; i < keys.length; ++i) {
        const key = keys[i];
        target[key] = source[key];
    }

    return target;
};

}).call(this,require('_process'),require("buffer").Buffer)

},{"./escape":17,"_process":24,"buffer":"buffer","crypto":20,"path":23,"util":26}],19:[function(require,module,exports){
'use strict';

// Load modules

const Hoek = require('hoek');


// Declare internals

const internals = {};


exports = module.exports = internals.Topo = function () {

    this._items = [];
    this.nodes = [];
};


internals.Topo.prototype.add = function (nodes, options) {

    options = options || {};

    // Validate rules

    const before = [].concat(options.before || []);
    const after = [].concat(options.after || []);
    const group = options.group || '?';
    const sort = options.sort || 0;                   // Used for merging only

    Hoek.assert(before.indexOf(group) === -1, 'Item cannot come before itself:', group);
    Hoek.assert(before.indexOf('?') === -1, 'Item cannot come before unassociated items');
    Hoek.assert(after.indexOf(group) === -1, 'Item cannot come after itself:', group);
    Hoek.assert(after.indexOf('?') === -1, 'Item cannot come after unassociated items');

    ([].concat(nodes)).forEach((node, i) => {

        const item = {
            seq: this._items.length,
            sort: sort,
            before: before,
            after: after,
            group: group,
            node: node
        };

        this._items.push(item);
    });

    // Insert event

    const error = this._sort();
    Hoek.assert(!error, 'item', (group !== '?' ? 'added into group ' + group : ''), 'created a dependencies error');

    return this.nodes;
};


internals.Topo.prototype.merge = function (others) {

    others = [].concat(others);
    for (let i = 0; i < others.length; ++i) {
        const other = others[i];
        if (other) {
            for (let j = 0; j < other._items.length; ++j) {
                const item = Hoek.shallow(other._items[j]);
                this._items.push(item);
            }
        }
    }

    // Sort items

    this._items.sort(internals.mergeSort);
    for (let i = 0; i < this._items.length; ++i) {
        this._items[i].seq = i;
    }

    const error = this._sort();
    Hoek.assert(!error, 'merge created a dependencies error');

    return this.nodes;
};


internals.mergeSort = function (a, b) {

    return a.sort === b.sort ? 0 : (a.sort < b.sort ? -1 : 1);
};


internals.Topo.prototype._sort = function () {

    // Construct graph

    const groups = {};
    const graph = {};
    const graphAfters = {};

    for (let i = 0; i < this._items.length; ++i) {
        const item = this._items[i];
        const seq = item.seq;                         // Unique across all items
        const group = item.group;

        // Determine Groups

        groups[group] = groups[group] || [];
        groups[group].push(seq);

        // Build intermediary graph using 'before'

        graph[seq] = item.before;

        // Build second intermediary graph with 'after'

        const after = item.after;
        for (let j = 0; j < after.length; ++j) {
            graphAfters[after[j]] = (graphAfters[after[j]] || []).concat(seq);
        }
    }

    // Expand intermediary graph

    let graphNodes = Object.keys(graph);
    for (let i = 0; i < graphNodes.length; ++i) {
        const node = graphNodes[i];
        const expandedGroups = [];

        const graphNodeItems = Object.keys(graph[node]);
        for (let j = 0; j < graphNodeItems.length; ++j) {
            const group = graph[node][graphNodeItems[j]];
            groups[group] = groups[group] || [];

            for (let k = 0; k < groups[group].length; ++k) {

                expandedGroups.push(groups[group][k]);
            }
        }
        graph[node] = expandedGroups;
    }

    // Merge intermediary graph using graphAfters into final graph

    const afterNodes = Object.keys(graphAfters);
    for (let i = 0; i < afterNodes.length; ++i) {
        const group = afterNodes[i];

        if (groups[group]) {
            for (let j = 0; j < groups[group].length; ++j) {
                const node = groups[group][j];
                graph[node] = graph[node].concat(graphAfters[group]);
            }
        }
    }

    // Compile ancestors

    let children;
    const ancestors = {};
    graphNodes = Object.keys(graph);
    for (let i = 0; i < graphNodes.length; ++i) {
        const node = graphNodes[i];
        children = graph[node];

        for (let j = 0; j < children.length; ++j) {
            ancestors[children[j]] = (ancestors[children[j]] || []).concat(node);
        }
    }

    // Topo sort

    const visited = {};
    const sorted = [];

    for (let i = 0; i < this._items.length; ++i) {
        let next = i;

        if (ancestors[i]) {
            next = null;
            for (let j = 0; j < this._items.length; ++j) {
                if (visited[j] === true) {
                    continue;
                }

                if (!ancestors[j]) {
                    ancestors[j] = [];
                }

                const shouldSeeCount = ancestors[j].length;
                let seenCount = 0;
                for (let k = 0; k < shouldSeeCount; ++k) {
                    if (sorted.indexOf(ancestors[j][k]) >= 0) {
                        ++seenCount;
                    }
                }

                if (seenCount === shouldSeeCount) {
                    next = j;
                    break;
                }
            }
        }

        if (next !== null) {
            next = next.toString();         // Normalize to string TODO: replace with seq
            visited[next] = true;
            sorted.push(next);
        }
    }

    if (sorted.length !== this._items.length) {
        return new Error('Invalid dependencies');
    }

    const seqIndex = {};
    for (let i = 0; i < this._items.length; ++i) {
        const item = this._items[i];
        seqIndex[item.seq] = item;
    }

    const sortedNodes = [];
    this._items = sorted.map((value) => {

        const sortedItem = seqIndex[value];
        sortedNodes.push(sortedItem.node);
        return sortedItem;
    });

    this.nodes = sortedNodes;
};

},{"hoek":18}],20:[function(require,module,exports){

},{}],21:[function(require,module,exports){
"function"==typeof Object.create?module.exports=function(t,e){t.super_=e,t.prototype=Object.create(e.prototype,{constructor:{value:t,enumerable:!1,writable:!0,configurable:!0}})}:module.exports=function(t,e){t.super_=e;var o=function(){};o.prototype=e.prototype,t.prototype=new o,t.prototype.constructor=t};
},{}],22:[function(require,module,exports){
module.exports=function(r){return!(null==r||!(r._isBuffer||r.constructor&&"function"==typeof r.constructor.isBuffer&&r.constructor.isBuffer(r)))};
},{}],23:[function(require,module,exports){
(function (process){
function normalizeArray(r,t){for(var e=0,n=r.length-1;n>=0;n--){var s=r[n];"."===s?r.splice(n,1):".."===s?(r.splice(n,1),e++):e&&(r.splice(n,1),e--)}if(t)for(;e--;e)r.unshift("..");return r}function filter(r,t){if(r.filter)return r.filter(t);for(var e=[],n=0;n<r.length;n++)t(r[n],n,r)&&e.push(r[n]);return e}var splitPathRe=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/,splitPath=function(r){return splitPathRe.exec(r).slice(1)};exports.resolve=function(){for(var r="",t=!1,e=arguments.length-1;e>=-1&&!t;e--){var n=e>=0?arguments[e]:process.cwd();if("string"!=typeof n)throw new TypeError("Arguments to path.resolve must be strings");n&&(r=n+"/"+r,t="/"===n.charAt(0))}return r=normalizeArray(filter(r.split("/"),function(r){return!!r}),!t).join("/"),(t?"/":"")+r||"."},exports.normalize=function(r){var t=exports.isAbsolute(r),e="/"===substr(r,-1);return r=normalizeArray(filter(r.split("/"),function(r){return!!r}),!t).join("/"),r||t||(r="."),r&&e&&(r+="/"),(t?"/":"")+r},exports.isAbsolute=function(r){return"/"===r.charAt(0)},exports.join=function(){var r=Array.prototype.slice.call(arguments,0);return exports.normalize(filter(r,function(r,t){if("string"!=typeof r)throw new TypeError("Arguments to path.join must be strings");return r}).join("/"))},exports.relative=function(r,t){function e(r){for(var t=0;t<r.length&&""===r[t];t++);for(var e=r.length-1;e>=0&&""===r[e];e--);return t>e?[]:r.slice(t,e-t+1)}r=exports.resolve(r).substr(1),t=exports.resolve(t).substr(1);for(var n=e(r.split("/")),s=e(t.split("/")),i=Math.min(n.length,s.length),o=i,u=0;i>u;u++)if(n[u]!==s[u]){o=u;break}for(var l=[],u=o;u<n.length;u++)l.push("..");return l=l.concat(s.slice(o)),l.join("/")},exports.sep="/",exports.delimiter=":",exports.dirname=function(r){var t=splitPath(r),e=t[0],n=t[1];return e||n?(n&&(n=n.substr(0,n.length-1)),e+n):"."},exports.basename=function(r,t){var e=splitPath(r)[2];return t&&e.substr(-1*t.length)===t&&(e=e.substr(0,e.length-t.length)),e},exports.extname=function(r){return splitPath(r)[3]};var substr="b"==="ab".substr(-1)?function(r,t,e){return r.substr(t,e)}:function(r,t,e){return 0>t&&(t=r.length+t),r.substr(t,e)};
}).call(this,require('_process'))

},{"_process":24}],24:[function(require,module,exports){
function cleanUpNextTick(){draining=!1,currentQueue.length?queue=currentQueue.concat(queue):queueIndex=-1,queue.length&&drainQueue()}function drainQueue(){if(!draining){var e=setTimeout(cleanUpNextTick);draining=!0;for(var n=queue.length;n;){for(currentQueue=queue,queue=[];++queueIndex<n;)currentQueue&&currentQueue[queueIndex].run();queueIndex=-1,n=queue.length}currentQueue=null,draining=!1,clearTimeout(e)}}function Item(e,n){this.fun=e,this.array=n}function noop(){}var process=module.exports={},queue=[],draining=!1,currentQueue,queueIndex=-1;process.nextTick=function(e){var n=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)n[r-1]=arguments[r];queue.push(new Item(e,n)),1!==queue.length||draining||setTimeout(drainQueue,0)},Item.prototype.run=function(){this.fun.apply(null,this.array)},process.title="browser",process.browser=!0,process.env={},process.argv=[],process.version="",process.versions={},process.on=noop,process.addListener=noop,process.once=noop,process.off=noop,process.removeListener=noop,process.removeAllListeners=noop,process.emit=noop,process.binding=function(e){throw new Error("process.binding is not supported")},process.cwd=function(){return"/"},process.chdir=function(e){throw new Error("process.chdir is not supported")},process.umask=function(){return 0};
},{}],25:[function(require,module,exports){
module.exports=function(o){return o&&"object"==typeof o&&"function"==typeof o.copy&&"function"==typeof o.fill&&"function"==typeof o.readUInt8};
},{}],26:[function(require,module,exports){
(function (process,global){
function inspect(e,r){var t={seen:[],stylize:stylizeNoColor};return arguments.length>=3&&(t.depth=arguments[2]),arguments.length>=4&&(t.colors=arguments[3]),isBoolean(r)?t.showHidden=r:r&&exports._extend(t,r),isUndefined(t.showHidden)&&(t.showHidden=!1),isUndefined(t.depth)&&(t.depth=2),isUndefined(t.colors)&&(t.colors=!1),isUndefined(t.customInspect)&&(t.customInspect=!0),t.colors&&(t.stylize=stylizeWithColor),formatValue(t,e,t.depth)}function stylizeWithColor(e,r){var t=inspect.styles[r];return t?"["+inspect.colors[t][0]+"m"+e+"["+inspect.colors[t][1]+"m":e}function stylizeNoColor(e,r){return e}function arrayToHash(e){var r={};return e.forEach(function(e,t){r[e]=!0}),r}function formatValue(e,r,t){if(e.customInspect&&r&&isFunction(r.inspect)&&r.inspect!==exports.inspect&&(!r.constructor||r.constructor.prototype!==r)){var n=r.inspect(t,e);return isString(n)||(n=formatValue(e,n,t)),n}var i=formatPrimitive(e,r);if(i)return i;var o=Object.keys(r),s=arrayToHash(o);if(e.showHidden&&(o=Object.getOwnPropertyNames(r)),isError(r)&&(o.indexOf("message")>=0||o.indexOf("description")>=0))return formatError(r);if(0===o.length){if(isFunction(r)){var u=r.name?": "+r.name:"";return e.stylize("[Function"+u+"]","special")}if(isRegExp(r))return e.stylize(RegExp.prototype.toString.call(r),"regexp");if(isDate(r))return e.stylize(Date.prototype.toString.call(r),"date");if(isError(r))return formatError(r)}var a="",c=!1,l=["{","}"];if(isArray(r)&&(c=!0,l=["[","]"]),isFunction(r)){var p=r.name?": "+r.name:"";a=" [Function"+p+"]"}if(isRegExp(r)&&(a=" "+RegExp.prototype.toString.call(r)),isDate(r)&&(a=" "+Date.prototype.toUTCString.call(r)),isError(r)&&(a=" "+formatError(r)),0===o.length&&(!c||0==r.length))return l[0]+a+l[1];if(0>t)return isRegExp(r)?e.stylize(RegExp.prototype.toString.call(r),"regexp"):e.stylize("[Object]","special");e.seen.push(r);var f;return f=c?formatArray(e,r,t,s,o):o.map(function(n){return formatProperty(e,r,t,s,n,c)}),e.seen.pop(),reduceToSingleString(f,a,l)}function formatPrimitive(e,r){if(isUndefined(r))return e.stylize("undefined","undefined");if(isString(r)){var t="'"+JSON.stringify(r).replace(/^"|"$/g,"").replace(/'/g,"\\'").replace(/\\"/g,'"')+"'";return e.stylize(t,"string")}return isNumber(r)?e.stylize(""+r,"number"):isBoolean(r)?e.stylize(""+r,"boolean"):isNull(r)?e.stylize("null","null"):void 0}function formatError(e){return"["+Error.prototype.toString.call(e)+"]"}function formatArray(e,r,t,n,i){for(var o=[],s=0,u=r.length;u>s;++s)hasOwnProperty(r,String(s))?o.push(formatProperty(e,r,t,n,String(s),!0)):o.push("");return i.forEach(function(i){i.match(/^\d+$/)||o.push(formatProperty(e,r,t,n,i,!0))}),o}function formatProperty(e,r,t,n,i,o){var s,u,a;if(a=Object.getOwnPropertyDescriptor(r,i)||{value:r[i]},a.get?u=a.set?e.stylize("[Getter/Setter]","special"):e.stylize("[Getter]","special"):a.set&&(u=e.stylize("[Setter]","special")),hasOwnProperty(n,i)||(s="["+i+"]"),u||(e.seen.indexOf(a.value)<0?(u=isNull(t)?formatValue(e,a.value,null):formatValue(e,a.value,t-1),u.indexOf("\n")>-1&&(u=o?u.split("\n").map(function(e){return"  "+e}).join("\n").substr(2):"\n"+u.split("\n").map(function(e){return"   "+e}).join("\n"))):u=e.stylize("[Circular]","special")),isUndefined(s)){if(o&&i.match(/^\d+$/))return u;s=JSON.stringify(""+i),s.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)?(s=s.substr(1,s.length-2),s=e.stylize(s,"name")):(s=s.replace(/'/g,"\\'").replace(/\\"/g,'"').replace(/(^"|"$)/g,"'"),s=e.stylize(s,"string"))}return s+": "+u}function reduceToSingleString(e,r,t){var n=0,i=e.reduce(function(e,r){return n++,r.indexOf("\n")>=0&&n++,e+r.replace(/\u001b\[\d\d?m/g,"").length+1},0);return i>60?t[0]+(""===r?"":r+"\n ")+" "+e.join(",\n  ")+" "+t[1]:t[0]+r+" "+e.join(", ")+" "+t[1]}function isArray(e){return Array.isArray(e)}function isBoolean(e){return"boolean"==typeof e}function isNull(e){return null===e}function isNullOrUndefined(e){return null==e}function isNumber(e){return"number"==typeof e}function isString(e){return"string"==typeof e}function isSymbol(e){return"symbol"==typeof e}function isUndefined(e){return void 0===e}function isRegExp(e){return isObject(e)&&"[object RegExp]"===objectToString(e)}function isObject(e){return"object"==typeof e&&null!==e}function isDate(e){return isObject(e)&&"[object Date]"===objectToString(e)}function isError(e){return isObject(e)&&("[object Error]"===objectToString(e)||e instanceof Error)}function isFunction(e){return"function"==typeof e}function isPrimitive(e){return null===e||"boolean"==typeof e||"number"==typeof e||"string"==typeof e||"symbol"==typeof e||"undefined"==typeof e}function objectToString(e){return Object.prototype.toString.call(e)}function pad(e){return 10>e?"0"+e.toString(10):e.toString(10)}function timestamp(){var e=new Date,r=[pad(e.getHours()),pad(e.getMinutes()),pad(e.getSeconds())].join(":");return[e.getDate(),months[e.getMonth()],r].join(" ")}function hasOwnProperty(e,r){return Object.prototype.hasOwnProperty.call(e,r)}var formatRegExp=/%[sdj%]/g;exports.format=function(e){if(!isString(e)){for(var r=[],t=0;t<arguments.length;t++)r.push(inspect(arguments[t]));return r.join(" ")}for(var t=1,n=arguments,i=n.length,o=String(e).replace(formatRegExp,function(e){if("%%"===e)return"%";if(t>=i)return e;switch(e){case"%s":return String(n[t++]);case"%d":return Number(n[t++]);case"%j":try{return JSON.stringify(n[t++])}catch(r){return"[Circular]"}default:return e}}),s=n[t];i>t;s=n[++t])o+=isNull(s)||!isObject(s)?" "+s:" "+inspect(s);return o},exports.deprecate=function(e,r){function t(){if(!n){if(process.throwDeprecation)throw new Error(r);process.traceDeprecation?console.trace(r):console.error(r),n=!0}return e.apply(this,arguments)}if(isUndefined(global.process))return function(){return exports.deprecate(e,r).apply(this,arguments)};if(process.noDeprecation===!0)return e;var n=!1;return t};var debugs={},debugEnviron;exports.debuglog=function(e){if(isUndefined(debugEnviron)&&(debugEnviron=process.env.NODE_DEBUG||""),e=e.toUpperCase(),!debugs[e])if(new RegExp("\\b"+e+"\\b","i").test(debugEnviron)){var r=process.pid;debugs[e]=function(){var t=exports.format.apply(exports,arguments);console.error("%s %d: %s",e,r,t)}}else debugs[e]=function(){};return debugs[e]},exports.inspect=inspect,inspect.colors={bold:[1,22],italic:[3,23],underline:[4,24],inverse:[7,27],white:[37,39],grey:[90,39],black:[30,39],blue:[34,39],cyan:[36,39],green:[32,39],magenta:[35,39],red:[31,39],yellow:[33,39]},inspect.styles={special:"cyan",number:"yellow","boolean":"yellow",undefined:"grey","null":"bold",string:"green",date:"magenta",regexp:"red"},exports.isArray=isArray,exports.isBoolean=isBoolean,exports.isNull=isNull,exports.isNullOrUndefined=isNullOrUndefined,exports.isNumber=isNumber,exports.isString=isString,exports.isSymbol=isSymbol,exports.isUndefined=isUndefined,exports.isRegExp=isRegExp,exports.isObject=isObject,exports.isDate=isDate,exports.isError=isError,exports.isFunction=isFunction,exports.isPrimitive=isPrimitive,exports.isBuffer=require("./support/isBuffer");var months=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];exports.log=function(){console.log("%s - %s",timestamp(),exports.format.apply(exports,arguments))},exports.inherits=require("inherits"),exports._extend=function(e,r){if(!r||!isObject(r))return e;for(var t=Object.keys(r),n=t.length;n--;)e[t[n]]=r[t[n]];return e};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./support/isBuffer":25,"_process":24,"inherits":21}],"buffer":[function(require,module,exports){
"use strict";var Buffer={isBuffer:function(){return!1}};module.exports={Buffer:Buffer};
},{}]},{},[8])


//# sourceMappingURL=browser/joi.js.map