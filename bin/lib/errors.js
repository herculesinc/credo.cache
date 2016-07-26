"use strict";
// IMPORTS
// ================================================================================================
const nova_base_1 = require('nova-base');
// CACHE ERROR CLASS
// ================================================================================================
class CacheError extends nova_base_1.Exception {
    constructor(cause, message) {
        super({ cause, message });
    }
}
exports.CacheError = CacheError;
//# sourceMappingURL=errors.js.map