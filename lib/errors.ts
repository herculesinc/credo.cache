// IMPORTS
// ================================================================================================
import { Exception } from 'nova-base';

// CACHE ERROR CLASS
// ================================================================================================
export class CacheError extends Exception {

    constructor(cause: Error, message: string) {
        super({ cause, message });
    }
}