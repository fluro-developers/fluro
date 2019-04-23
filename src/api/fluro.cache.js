import _ from 'lodash';

import {Cache} from 'axios-extensions';


///////////////////////////////////////////////////////////////////////////////

var caches = {};


/**
 * @classdesc A static service that provides tools for caching api requests and other information
 * @class
 * @hideconstructor
 */
var FluroCache = {

    ///////////////////////////////////////////////////

    
    /**
     * A helper function to reset all cache objects, useful if changing account or logging in or out as another user     
     * @alias FluroCache.reset    
     */
    reset() {
        _.each(caches, function(cache, key) {
            // console.log(`Reset ${key} cache`);
            cache.reset();
        })
    },

    ////////////////////////

    ///////////////////////////////////////////////////

    /**
     * A helper function to retrieve a specific cache  
     * @alias FluroCache.get    
     * @param  {string} key The key for the cache you want to retrieve
     * @return {LRUCache} The cache store for the specified key
     */
    get(key) {

        if (caches[key]) {
            return caches[key];
        }
        caches[key] = new Cache()

        // console.log('Created new cache', key);
        
        return caches[key];

    }
}


///////////////////////////////////////////////////////////////////////////////

export default FluroCache;