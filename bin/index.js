"use strict";
// IMPORTS
// ================================================================================================
const nova_base_1 = require('nova-base');
const RedisCache_1 = require('./lib/RedisCache');
// CACHE ERROR
// ================================================================================================
class CacheError extends nova_base_1.Exception {
    constructor(cause, message) {
        super({ cause, message });
    }
}
exports.CacheError = CacheError;
// PUBLIC FUNCTIONS
// ================================================================================================
function connect(options, logger) {
    if (!options)
        throw TypeError('Cannot connect to Cache: options are undefined');
    if (!options.redis)
        throw TypeError('Cannot connect to Cache: connection config is undefined');
    return Promise.resolve(new RedisCache_1.RedisCache(options, logger));
}
exports.connect = connect;
//# sourceMappingURL=index.js.map