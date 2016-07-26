// IMPORTS
// ================================================================================================
import { Cache } from './../index';
import { MockLogger } from './mocks/Logger';

// SETUP
// ================================================================================================
const config = {
    name        : 'testcache',
    redis: {
        host    : '',
        port    : 6379,
        password: '',
        prefix  : 'testcache'
    }
};

const cache = new Cache(config, new MockLogger());

// TESTS
// ================================================================================================
async function runTests() {
    
    cache.set('key1', { value: 1 });

    let value = await cache.get('key1');
    console.log(value);

    cache.clear('key1');

    value = await cache.get('key1');
    console.log(typeof value);
    console.log(value);

    cache.set('key1', { value: 1 });
    cache.set('key2', { value: 2 });
    let values = await cache.get(['key1', 'key2', 'key3']);
    console.log(values);

    cache.clear(['key1', 'key2', 'key3']);
    values = await cache.get(['key1', 'key2', 'key3']);
    console.log(values);
}

// RUN TEST
// ================================================================================================
runTests();