import axios from 'axios';
import _ from 'lodash';

import {
    cacheAdapterEnhancer,
    throttleAdapterEnhancer,
    Cache,
} from 'axios-extensions';


const CancelToken = axios.CancelToken;

///////////////////////////////////////

/**
 * Creates a new FluroAPI instance.
 * This module is a wrapper around the <a href="https://www.npmjs.com/package/axios">axios</a> package. It aims to make it easier for you to connect with and consume endpoints from the
 * Fluro REST API for more information about the available endpoints see <a href="https://developer.fluro.io">Fluro REST API Documentation</a>
 * 
 * @constructor
 * @param {FluroCore} fluro A reference to the parent instance of the FluroCore module. The FluroAPI module is usually created by a FluroCore instance that passes itself in as the first argument.
 *
 * @example
 * //Make a request to get the current user session
 * fluro.api.get('/session')
 * .then(function (response) {
 *   console.log(response);
 * })
 * .catch(function (error) {
 *   console.log(error);
 * });
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
    var defaultCache;

    if (process.browser) {
        defaultCache = fluro.cache.get('api');
    }

    ///////////////////////////////////////

    var service = axios.create({
        adapter: throttleAdapterEnhancer(cacheAdapterEnhancer(axios.defaults.adapter, { defaultCache: defaultCache }))
    });

    ///////////////////////////////////////

    service.defaults.baseURL = fluro.apiURL;
    service.defaults.headers.common.Accept = 'application/json';
    service.defaults.withCredentials = fluro.withCredentials;

    /////////////////////////////////////////////////////

    // Add relative date and timezone to every request
    service.interceptors.request.use(function (config) {
        config.headers['fluro-request-date'] = new Date().getTime();
        config.headers['fluro-request-timezone'] = fluro.date.defaultTimezone;
        return config;
    });

    /////////////////////////////////////////////////////

    service.interceptors.response.use(function(response) {
        return response;
    }, function(err) {

        if (axios.isCancel(err)) {
            console.log('Request cancelled');
            return Promise.reject(err);
        }

        //Get the response status
        var status = _.get(err, 'response.status') || err.status;

        //Check the status
        switch (status) {
            case 401:
                //Ignore and allow fluro.auth to handle it
                break;
            case 502:
                // case 503:
            case 504:
                //Retry
                //Try it again
                console.log(`fluro.api > ${status} connection error retrying`)
                return fluro.api.request(err.config);
                break;
            default:
                //Some other error
                console.log('fluro.api > connection error', status, err.config.url);
                break;
        }

        /////////////////////////////////////////////////////

        return Promise.reject(err);
    })


    /**
     * @name FluroAPI.get
     * @description Makes a get http request to the Fluro REST API
     * @function
     * @param {String} path The Fluro API endpoint to request
     * @param {Object} config Optional parameters for the request
     * @example
     * //Make a request to get the current user session
     * fluro.api.get('/content/article', {
     *   params:{
     *     select:'title created',
     *     limit:10,
     *     simple:true,
     *   }
     * })
     * .then(function (response) {
     *   console.log(response);
     * })
     * .catch(function (error) {
     *   console.log(error);
     * });
     */


    /**
     * @name FluroAPI.post
     * @description Makes a post http request to the Fluro REST API
     * @function
     * @param {String} path The Fluro API endpoint to request
     * @param {Object} config Optional parameters for the request
     * @example
     * 
     * fluro.api.post('/content/article', {title:'my new article', ...}, {
     *   //headers and other things
     * })
     * .then(function (response) {
     *   console.log(response);
     * })
     * .catch(function (error) {
     *   console.log(error);
     * });
     */

    /**
     * @name FluroAPI.put
     * @description Makes a put http request to the Fluro REST API
     * @function
     * @param {String} path The Fluro API endpoint to request
     * @param {Object} config Optional parameters for the request
     * @example
     * 
     * fluro.api.put('/content/article/5ca3d64dd2bb085eb9d450db', {title:'my new article', ...}, {
     *   //headers and other things
     * })
     * .then(function (response) {
     *   console.log(response);
     * })
     * .catch(function (error) {
     *   console.log(error);
     * });
     */

    /**
     * @name FluroAPI.delete
     * @description Makes a delete http request to the Fluro REST API
     * @function
     * @param {String} path The Fluro API endpoint to request
     * @param {Object} config Optional parameters for the request
     * @example
     * 
     * fluro.api.delete('/content/article/5ca3d64dd2bb085eb9d450db')
     * .then(function (response) {
     *   console.log(response);
     * })
     * .catch(function (error) {
     *   console.log(error);
     * });
     */

    service.CancelToken = CancelToken;

    ///////////////////////////////////////

    return service;
}




///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

export { CancelToken as CancelToken };
export default FluroAPI;