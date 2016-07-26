declare module "@credo/cache" {
    
    // IMPORTS
    // --------------------------------------------------------------------------------------------
    import * as nova from 'nova-base';

    // REDIS CONNECTION
    // --------------------------------------------------------------------------------------------
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

	// CACHE
    // --------------------------------------------------------------------------------------------
	export interface Options {
		name?       : string;
        redis       : RedisConnectionConfig;
        logger?     : nova.Logger;
	}
	
	export interface Cache {
        get(key: string): Promise<any>;
        get(keys: string[]): Promise<any[]>;

        set(key: string, value: any, expires?: number);
        execute(script: string, keys: string[], parameters: any[]): Promise<any>;

        clear(key: string);
        clear(keys: string[]);

        on(event: 'error', callback: (error: Error) => void);
    }

	// PUBLIC FUNCTIONS
    // --------------------------------------------------------------------------------------------
	export function connect(options: Options): Promise<Cache>;
}