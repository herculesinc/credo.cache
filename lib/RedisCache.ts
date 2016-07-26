// IMPORTS
// ================================================================================================
import * as events from 'events';
import * as redis from 'redis';
import { util, Logger } from 'nova-base';
import { Options, CacheError } from './../index';

// MODULE VARIABLES
// ================================================================================================
const since = util.since;
const ERROR_EVENT = 'error';

// REDIS CACHE CLASS
// ================================================================================================
export class RedisCache extends events.EventEmitter {

    name    : string;
    client  : redis.RedisClient;
    logger? : Logger;

    // CONSTRUCTOR
    // --------------------------------------------------------------------------------------------
    constructor(options: Options, logger?: Logger) {
        super();

        if (!options) throw TypeError('Cannot create Redis Cache: options are undefined');

        // initialize class variables
        this.name = options.name || 'cache';
        this.client = redis.createClient(options.redis);
        this.logger = logger;

        // listen to error event
        this.client.on('error', (error) => {
            error = new CacheError(error, 'Unknown cache error');
            this.emit(ERROR_EVENT, error);
        });
    }

    // PUBLIC MEMBERS
    // --------------------------------------------------------------------------------------------
    get(keyOrKyes: string | string[]): Promise<any> {
        if (!keyOrKyes) throw new TypeError('Cannot get values from cache: keys are undefined');
        return Array.isArray(keyOrKyes) ? this.getAll(keyOrKyes) : this.getOne(keyOrKyes);
    }

    set(key: string, value: any, expires?: number) {
        if (!key) throw new TypeError('Cannot set cache key: key is undefined');
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
                    error = new CacheError(error, 'Failed to clear cache items');
                    this.emit(ERROR_EVENT, error);
                }
            });
        }
        else {
            this.client.set(key, stringValue, (error) => {
                this.logger && this.logger.trace(this.name, 'set', since(start), !error);
                if (error) {
                    error = new CacheError(error, 'Failed to clear cache items');
                    this.emit(ERROR_EVENT, error);
                }
            });
        }
    }

    execute(script: string, keys: string[] = [], parameters: string[] = []): Promise<any> {
        if (!script) throw new TypeError('Cannot execute cache script: script is undefined');
        const start = process.hrtime();

        // log the operation
        this.logger && this.logger.debug(`Executing cache script`);

        return new Promise((resolve, reject) => {
            // execute the script
            this.client.eval(script, keys.length, ...keys, ...parameters, (error, result) => {
                if (error) {
                    this.logger && this.logger.trace(this.name, 'execute', since(start), false);
                    error = new CacheError(error, 'Failed to execute cache script');
                    return reject(error);
                }
				
                // log the operation
                this.logger && this.logger.trace(this.name, 'execute', since(start));

                // parse the response
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

    clear(keyOrKeys: string | string[]) {
        if (!keyOrKeys) throw new TypeError('Cannot clear cache keys: keys are undefined');
        const start = process.hrtime();
        const keys = Array.isArray(keyOrKeys) ? keyOrKeys : [keyOrKeys];

        // log the operation
        this.logger && this.logger.debug(`Clearing values for (${keys.length}) keys from the cache`);

        // execute redis del command
        this.client.del(keys, (error) => {
            this.logger && this.logger.trace(this.name, 'clear', since(start), !error);
            if (error) {
                error = new CacheError(error, 'Failed to clear cache items');
                this.emit(ERROR_EVENT, error);
            }
        });
    }

    // PRIVATE METHODS
    // --------------------------------------------------------------------------------------------
    private getOne(key: string): Promise<any> {
        const start = process.hrtime();

        // log the operation
        this.logger && this.logger.debug(`Retrieving value for key (${key}) from the cache`);

        return new Promise((resolve, reject) => {
            // run the get command and return the result
            this.client.get(key, (error, result) => {
                if (error) {
                    this.logger && this.logger.trace(this.name, 'get', since(start), false);
                    error = new CacheError(error, 'Failed to retrieve a value from cache');
                    return reject(error);
                }
                
                // log the operation
                this.logger && this.logger.trace(this.name, 'get', since(start));
                
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

    private getAll(keys: string[]): Promise<any[]> {
        const start = process.hrtime();

        // log the operation
        this.logger && this.logger.debug(`Retrieving values for (${keys.length}) keys from the cache`);

        return new Promise((resolve, reject) => {
            // run the get command and return the result
            this.client.mget(keys, (error, results) => {
                if (error) {
                    this.logger && this.logger.trace(this.name, 'get', since(start), false);
                    error = new CacheError(error, 'Failed to retrieve values from cache');
                    return reject(error);
                }
                
                // log the operation
                this.logger && this.logger.trace(this.name, 'get', since(start));

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