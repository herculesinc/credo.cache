declare module "@credo/cache" {
    
    // IMPORTS
    // --------------------------------------------------------------------------------------------
    import * as events from 'events';
    import * as nova from 'nova-base';

    // REDIS CONNECTION
    // --------------------------------------------------------------------------------------------
    export interface RedisConnectionConfig {
        host            : string;
        port            : number;
        password        : string;
        prefix?         : string;
        retry_strategy? : (options: ConnectionRetryOptions) => number | Error;
    }

    export interface ConnectionRetryOptions {
        error           : any;
        attempt         : number;
        total_retry_time: number;
        times_connected : number;
    }

	// CACHE
    // --------------------------------------------------------------------------------------------
	export interface CacheConfig {
		name?       : string;
        redis       : RedisConnectionConfig;
	}
	
	export class Cache extends events.EventEmitter implements nova.Cache {

        constructor(config: CacheConfig, logger?: nova.Logger)

        get(key: string): Promise<any>;
        get(keys: string[]): Promise<any[]>;

        set(key: string, value: any, expires?: number);
        execute(script: string, keys: string[], parameters: any[]): Promise<any>;

        clear(key: string);
        clear(keys: string[]);

        on(event: 'error', callback: (error: CacheError) => void);
    }

    // CACHE
    // --------------------------------------------------------------------------------------------
    export class CacheError extends nova.Exception {
        constructor(cause: Error, message: string);
    }
}