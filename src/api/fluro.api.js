import axios from 'axios';
import {
    cacheAdapterEnhancer,
    throttleAdapterEnhancer,
    Cache,
} from 'axios-extensions';

///////////////////////////////////////

/**
 * Creates a new FluroAPI instance.
 * This module is a wrapper around the 'axios' npm module. It aims to make it easier for you to connect with and consume endpoints from the
 * Fluro REST API
 * 
 * @constructor
 * @param {FluroCore} fluro A reference to the parent instance of the FluroCore module. The FluroAPI module is usually created by a FluroCore instance that passes itself in as the first argument.
 */
var FluroAPI = function(fluro) {

    ///////////////////////////////////////

    // //Cache Defaults
    // var FIVE_MINUTES = 1000 * 60 * 5;
    // var CAPACITY = 100;
    // { maxAge: FIVE_MINUTES, max: 100 }


    /**
     * The default cache to use when requests are made from this instance
     * @type {LRUCache}
     * @access private
     */
    var defaultCache = fluro.cache.get('api');

    ///////////////////////////////////////

    var service = axios.create({
        adapter: throttleAdapterEnhancer(cacheAdapterEnhancer(axios.defaults.adapter, {defaultCache:defaultCache}))
    });


    ///////////////////////////////////////

    service.defaults.baseURL = fluro.apiURL;
    service.defaults.headers.common.Accept = 'application/json';


    /////////////////////////////////////////////////////

    service.interceptors.response.use(function(response) {
        return response;
    }, function(err) {

        //Get the response status
        var status = err.response.status;


        switch (status) {
            case 401:
                //Ignore and allow fluro.auth to handle it
                break;
            case 502:
                // case 503:
            case 504:
                //Retry
                console.log('fluro.api > connection error retrying')
                Fluro.api.request(err.config);
                break;
            default:
                //Some other error
                console.log('fluro.api > connection error', err);
                break;
        }

        /////////////////////////////////////////////////////

        return Promise.reject(err);
    })


    ///////////////////////////////////////

    return service;
}



///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

export default FluroAPI;