// IMPORTS
// ================================================================================================
import { Logger, Exception } from 'nova-base';
import { RedisCache } from './lib/RedisCache';

// INTERFACES
// ================================================================================================
export interface RedisConnectionConfig {
    host            : string;
    port            : number;
    password        : string;
    prefix?         : string;
    retry_strategy? : (options: any) => number | Error;
}

export interface ConnectionRetryOptions {
    error           : Error;
    attempt         : number;
    total_retry_time: number;
    times_connected : number;
}

export interface Options {
    name?           : string;
    connection      : RedisConnectionConfig;
}

// CACHE ERROR
// ================================================================================================
export class CacheError extends Exception {
    constructor(cause: Error, message: string) {
        super({ cause, message });
    }
}

// PUBLIC FUNCTIONS
// ================================================================================================
export function connect(options: Options, logger?: Logger): Promise<RedisCache> {
    if (!options) throw TypeError('Cannot connect to Cache: options are undefined');
    if (!options.connection) throw TypeError('Cannot connect to Cache: connection config is undefined');
    return Promise.resolve(new RedisCache(options, logger));
}