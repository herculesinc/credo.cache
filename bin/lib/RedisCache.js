"use strict";
// IMPORTS
// ================================================================================================
const events = require('events');
const redis = require('redis');
const nova_base_1 = require('nova-base');
const index_1 = require('./../index');
// MODULE VARIABLES
// ================================================================================================
const since = nova_base_1.util.since;
const ERROR_EVENT = 'error';
// REDIS CACHE CLASS
// ================================================================================================
class RedisCache extends events.EventEmitter {
    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(options, logger) {
        super();
        if (!options)
            throw TypeError('Cannot create Redis Cache: options are undefined');
        // initialize class variables
        this.name = options.name || 'cache';
        this.client = redis.createClient(options);
        this.logger = logger;
        // listen to error event
        this.client.on('error', (error) => {
            error = new index_1.CacheError(error, 'Unknown cache error');
            this.emit('error', error);
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
        // log the operation
        this.logger && this.logger.debug(`Setting value for key (${key}) in the cache`);
        // convert value to string representation
        const stringValue = JSON.stringify(value);
        // execute redis set (or setex) command
        if (expires) {
            this.client.setex(key, expires, stringValue, (error) => {
                this.logger && this.logger.trace(this.name, 'set', since(start), !error);
                if (error) {
                    error = new index_1.CacheError(error, 'Failed to clear cache items');
                    this.emit(ERROR_EVENT, error);
                }
            });
        }
        else {
            this.client.set(key, stringValue, (error) => {
                this.logger && this.logger.trace(this.name, 'set', since(start), !error);
                if (error) {
                    error = new index_1.CacheError(error, 'Failed to clear cache items');
                    this.emit(ERROR_EVENT, error);
                }
            });
        }
    }
    execute(script, keys = [], parameters = []) {
        if (!script)
            throw new TypeError('Cannot execute cache script: script is undefined');
        const start = process.hrtime();
        // log the operation
        this.logger && this.logger.debug(`Executing cache script`);
        return new Promise((resolve, reject) => {
            // execute the script
            this.client.eval(script, keys.length, ...keys, ...parameters, (error, result) => {
                if (error) {
                    this.logger && this.logger.trace(this.name, 'execute', since(start), false);
                    error = new index_1.CacheError(error, 'Failed to execute cache script');
                    return reject(error);
                }
                // log the operation
                this.logger && this.logger.trace(this.name, 'execute', since(start));
                // parse the response
                try {
                    var value = JSON.parse(result);
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
        // log the operation
        this.logger && this.logger.debug(`Clearing values for (${keys.length}) keys from the cache`);
        // execute redis del command
        this.client.del(keys, (error) => {
            this.logger && this.logger.trace(this.name, 'clear', since(start), !error);
            if (error) {
                error = new index_1.CacheError(error, 'Failed to clear cache items');
                this.emit(ERROR_EVENT, error);
            }
        });
    }
    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    getOne(key) {
        const start = process.hrtime();
        // log the operation
        this.logger && this.logger.debug(`Retrieving value for key (${key}) from the cache`);
        return new Promise((resolve, reject) => {
            // run the get command and return the result
            this.client.get(key, (error, result) => {
                if (error) {
                    this.logger && this.logger.trace(this.name, 'get', since(start), false);
                    error = new index_1.CacheError(error, 'Failed to retrieve a value from cache');
                    return reject(error);
                }
                // log the operation
                this.logger && this.logger.trace(this.name, 'get', since(start));
                try {
                    var value = JSON.parse(result);
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
        // log the operation
        this.logger && this.logger.debug(`Retrieving values for (${keys.length}) from the cache`);
        return new Promise((resolve, reject) => {
            // run the get command and return the result
            this.client.mget(keys, (error, results) => {
                if (error) {
                    this.logger && this.logger.trace(this.name, 'get', since(start), false);
                    error = new index_1.CacheError(error, 'Failed to retrieve values from cache');
                    return reject(error);
                }
                // log the operation
                this.logger && this.logger.trace(this.name, 'get', since(start));
                // deserialize values
                const values = [];
                for (let result of results) {
                    try {
                        values.push(JSON.parse(result));
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
exports.RedisCache = RedisCache;
//# sourceMappingURL=RedisCache.js.map