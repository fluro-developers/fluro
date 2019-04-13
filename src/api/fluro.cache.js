import _ from 'lodash';

import {Cache} from 'axios-extensions';


///////////////////////////////////////////////////////////////////////////////

var caches = {};

var FluroCache = {
    reset() {
        _.each(caches, function(cache, key) {
            // console.log(`Reset ${key} cache`);
            cache.reset();
        })
    },

    ////////////////////////

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