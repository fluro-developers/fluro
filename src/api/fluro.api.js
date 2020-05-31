import axios from 'axios';
import _ from 'lodash';
import qs from 'qs';



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

    //Get the default adapter
    const defaultAdapter = axios.defaults.adapter
    // console.log('DEFAULT ADAPTER', defaultAdapter)


    ///////////////////////////////////////

    //Add our own adapter to the service
    let cacheAdapter = function(config) {

        return new Promise(function(resolve, reject) {


            var useCache;
            var cachedResponse;

            ///////////////////////////////////////

            //Don't cache action methods
            switch (String(config.method).toLowerCase()) {
                case 'post':
                case 'patch':
                case 'put':
                case 'delete':
                    //Unless we've specified we want a cache
                    if (!config.cache) {
                        //Don't use the cache
                        config.cache = false;
                    }
                    break;
            }

            ///////////////////////////////////////
            ///////////////////////////////////////

            if (config.cache === false) {
                //No cache so make new request
            } else {

                //Use the cache specified or the default cache
                useCache = config.cache || defaultCache;

                //If there is a cache
                if (useCache) {

                    //Generate the cache key from the request
                    var cacheKey = getCacheKeyFromConfig(config);

                    //If we have the cachedResponse version
                    cachedResponse = useCache.get(cacheKey);
                }
            }

            ///////////////////////////////////////
            ///////////////////////////////////////

            if (cachedResponse) {
                // console.log('FROM CACHE', config.url, cachedResponse);
                return resolve(cachedResponse);
            }



            // const axiosWithoutAdapter = createNewAxios();


            var copy = Object.assign(config, { adapter: defaultAdapter });
           

            // console.log('NEW ADAPTER THING', copy)
            // const axiosWithoutAdapter = axios(copy);


            return axios.request(config)
                .then(function(res) {

                    // console.log('RESPONSE', res)
                    resolve(res);
                }, function(err) {

                    // console.log('ERROR', err)
                    reject(err);
                });

        })
    }


    //////////////////////////////////////////////////////////////////////////////

    const service = createNewAxios(cacheAdapter);

    //////////////////////////////////////////////////////////////////////////////

    function createNewAxios(adapter) {

        var instance = axios.create({
            paramsSerializer: params => qs.stringify(params, { arrayFormat: 'repeat' }),
            adapter,
            // adapter: throttleAdapterEnhancer(cacheAdapterEnhancer(axios.defaults.adapter, { defaultCache: defaultCache }))
            // adapter: throttleAdapterEnhancer(cacheAdapterEnhancer(axios.defaults.adapter, { defaultCache: defaultCache }))
        });

        ///////////////////////////////////////

        instance.defaults.baseURL = fluro.apiURL;
        instance.defaults.headers.common.Accept = 'application/json';
        instance.defaults.withCredentials = fluro.withCredentials;

        /////////////////////////////////////////////////////

        // Add relative date and timezone to every request
        instance.interceptors.request.use(function(config) {

            config.headers['fluro-request-date'] = new Date().getTime();
            if (fluro.date.defaultTimezone) {
                config.headers['fluro-request-timezone'] = fluro.date.defaultTimezone;
            }

            //It's just a normal request
            if (!config.application) {
                return config;
            }

            ////////////////////////

            //There's no app or app user defined anyway
            if (!fluro.app || !fluro.app.user) {
                return config;
            }

            ////////////////////////

            console.log('request the thing in application context with a user', fluro.app.user.firstName);
            return config;

        });

        /////////////////////////////////////////////////////

        instance.interceptors.response.use(function(response) {


            var config = response.config
            var cacheKey = getCacheKeyFromConfig(config);
            var cache = response.config.cache || defaultCache;

            /////////////////////////////////////////////////////

            if (!cache) {
                return response;
            }

            /////////////////////////////////////////////////////

            switch (String(config.method).toLowerCase()) {
                case 'put':
                case 'patch':
                case 'post':
                case 'delete':

                    var ids = retrieveIDs({ _id: (config.data || {})._id, params: config.params, url: config.url });
                    cache.forEach(function(value, key, cache) {
                        var cacheIDs = retrieveIDs({ key, value });
                        var crossover = _.intersection(cacheIDs, ids).length;
                        if (crossover) {
                            cache.del(key);
                            // console.log('WIPE RELATED KEY', key);
                        }
                    });
                    break;
                default:
                    //Save into the cache
                    cache.set(cacheKey, response);
                    break;
            }

            /////////////////////////////////////////////////////

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
                    return instance.request(err.config);
                    break;
                case 404:
                    break;
                default:
                    //Some other error
                    console.log('fluro.api > connection error', status, err);
                    break;
            }

            /////////////////////////////////////////////////////

            return Promise.reject(err);
        })

        /////////////////////////////////////////////////////

        return instance;
    }





    ///////////////////////////////////////


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




    /////////////////////////////////////////////////////

    //Get all mongo ids from a string
    function retrieveIDs(data) {

        var dataString;

        if (_.isString(data)) {
            dataString = data;
        } else {
            dataString = JSON.stringify(data);
        }

        //Find all mongo ids included in the object
        var myregexp = /[0-9a-fA-F]{24}/g;
        var matches = dataString.match(myregexp);

        //Make sure the matches are unique
        return _.uniq(matches);
    }

    /////////////////////////////////////////////////////

    function getCacheKeyFromConfig(config) {


        var key = _.compact([
            config.method,
            config.url,
            JSON.stringify({ params: config.params, data: config.data })
        ]).join('-')


        // console.log('GET CACHE KEY', key)
        return key;
    }

    ///////////////////////////////////////


    service.CancelToken = CancelToken;
    service.axios = axios;

    ///////////////////////////////////////

    return service;
}




///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

export { CancelToken as CancelToken };
export default FluroAPI;