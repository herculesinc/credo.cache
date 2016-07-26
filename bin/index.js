"use strict";
// IMPORTS
// ================================================================================================
const events = require('events');
const redis = require('redis');
const nova = require('nova-base');
// MODULE VARIABLES
// ================================================================================================
const since = nova.util.since;
const ERROR_EVENT = 'error';
// CACHE CLASS
// ================================================================================================
class Cache extends events.EventEmitter {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(config, logger) {
        super();
        if (!config)
            throw TypeError('Cannot create Cache: config undefined');
        if (!config.redis)
            throw TypeError('Cannot create Cache: redis settings are undefined');
        // initialize class variables
        this.name = config.name || 'cache';
        this.client = redis.createClient(config.redis);
        this.logger = logger;
        // listen to error event
        this.client.on('error', (error) => {
            this.emit(ERROR_EVENT, new CacheError(error, 'Cache error'));
        });
    }
    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    get(keyOrKyes) {
        if (!keyOrKyes)
            throw new TypeError('Cannot get values from cache: keys are undefined');
        return Array.isArray(keyOrKyes) ? this.getAll(keyOrKyes) : this.getOne(keyOrKyes);
    }
    set(key, value, expires) {
        if (!key)
            throw new TypeError('Cannot set cache key: key is undefined');
        const start = process.hrtime();
        this.logger && this.logger.debug(`Setting value for key (${key}) in the cache`);
        // convert value to string representation
        const stringValue = JSON.stringify(value);
        // execute redis set (or setex) command
        if (expires) {
            this.client.setex(key, expires, stringValue, (error) => {
                this.logger && this.logger.trace(this.name, 'set', since(start), !error);
                if (error) {
                    this.emit(ERROR_EVENT, new CacheError(error, 'Failed to clear cache items'));
                }
            });
        }
        else {
            this.client.set(key, stringValue, (error) => {
                this.logger && this.logger.trace(this.name, 'set', since(start), !error);
                if (error) {
                    this.emit(ERROR_EVENT, new CacheError(error, 'Failed to clear cache items'));
                }
            });
        }
    }
    execute(script, keys = [], parameters = []) {
        if (!script)
            throw new TypeError('Cannot execute cache script: script is undefined');
        const start = process.hrtime();
        this.logger && this.logger.debug(`Executing cache script`);
        return new Promise((resolve, reject) => {
            // execute the script
            this.client.eval(script, keys.length, ...keys, ...parameters, (error, result) => {
                this.logger && this.logger.trace(this.name, 'execute', since(start), !error);
                if (error) {
                    return reject(new CacheError(error, 'Failed to execute cache script'));
                }
                try {
                    var value = result ? JSON.parse(result) : undefined;
                }
                catch (err) {
                    this.logger && this.logger.warn(`Failed to deserialize cache value ${result}`);
                }
                // return the result
                resolve(value);
            });
        });
    }
    clear(keyOrKeys) {
        if (!keyOrKeys)
            throw new TypeError('Cannot clear cache keys: keys are undefined');
        const start = process.hrtime();
        const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];
        this.logger && this.logger.debug(`Clearing values for (${keys.length}) keys from cache`);
        // execute redis del command
        this.client.del(keys, (error) => {
            this.logger && this.logger.trace(this.name, 'clear', since(start), !error);
            if (error) {
                this.emit(ERROR_EVENT, new CacheError(error, 'Failed to clear cache items'));
            }
        });
    }
    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    getOne(key) {
        const start = process.hrtime();
        this.logger && this.logger.debug(`Retrieving value for key (${key}) from the cache`);
        return new Promise((resolve, reject) => {
            // run the get command and return the result
            this.client.get(key, (error, result) => {
                this.logger && this.logger.trace(this.name, 'get', since(start), !error);
                if (error) {
                    return reject(new CacheError(error, 'Failed to retrieve a value from cache'));
                }
                try {
                    var value = result ? JSON.parse(result) : undefined;
                }
                catch (err) {
                    this.logger && this.logger.warn(`Failed to deserialize cache value ${result}`);
                }
                // return the value
                resolve(value);
            });
        });
    }
    getAll(keys) {
        const start = process.hrtime();
        this.logger && this.logger.debug(`Retrieving values for (${keys.length}) keys from the cache`);
        return new Promise((resolve, reject) => {
            // run the get command and return the result
            this.client.mget(keys, (error, results) => {
                this.logger && this.logger.trace(this.name, 'get', since(start), !error);
                if (error) {
                    return reject(new CacheError(error, 'Failed to retrieve values from cache'));
                }
                // deserialize values
                const values = [];
                for (let result of results) {
                    try {
                        values.push(result ? JSON.parse(result) : undefined);
                    }
                    catch (err) {
                        this.logger && this.logger.warn(`Failed to deserialize cache value ${result}`);
                    }
                }
                // return the results
                resolve(values);
            });
        });
    }
}
exports.Cache = Cache;
// CACHE ERROR
// ================================================================================================
class CacheError extends nova.Exception {
    constructor(cause, message) {
        super({ cause, message });
    }
}
exports.CacheError = CacheError;
//# sourceMappingURL=index.js.map