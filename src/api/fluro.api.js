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
 * This module is a wrapper around the <a href="https://www.npmjs.com/package/axios">axios</a> package. It aims to make it easier for you to connect with and consume endpoints from the Fluro REST API for more information about the available endpoints see <a href="https://developer.fluro.io">Fluro REST API Documentation</a>
 * @alias api
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


            config.headers['fluro-api-version'] = '2.1.57';


                        // console.log('USER CONTEXT BY DEFAULT?', fluro.userContextByDefault, config.application, config.disableUserContext)

            ////////////////////////

            //We aren't using the user context by default
            if(!fluro.userContextByDefault) {
                //It's just a normal request and we haven't specified an application
                if (!config.application || config.disableUserContext) {
                    return config;
                }
            }



            if (!fluro.app) {
                return config;
            }

            ////////////////////////

            if(fluro.app.uuid) {
                config.headers['fluro-app-uuid'] = fluro.app.uuid;
                console.log('request uuid')
            }


            ////////////////////////

            //There's no app or app user defined anyway
            if (!fluro.app.user) {
                return config;
            }

            ////////////////////////

            console.log('Request as user', fluro.app.user.firstName);
            config.headers['Authorization'] = `Bearer ${fluro.app.user.token}`;

            if(config.params && config.params.access_token) {
                delete config.params.access_token;
            }

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

                    var idSource = {
                        _id: (config.data || {})._id,
                        params: config.params,
                        url: config.url,
                    }

                    var ids = retrieveIDs(idSource);

                    cache.forEach(function(value, key, cache) {

                        if(value.data) {
                            value = value.data;
                            // console.log('down one level', value)
                        }

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
                    if(fluro.app && fluro.app.user) {
                        fluro.app.user = null;
                    }
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
     * @name api.get
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
     * @name api.post
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
     * @name api.put
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
     * @name api.delete
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



    ///////////////////////////////////////////////////

    /**
     * A helper function for generating an authenticated url for the current user
     * @param  {string} endpoint The id of the asset, or the asset object you want to download
     * @alias api.generateEndpointURL
     * @param  {object} params   
     * @return {string}          A full URL with relevant parameters included
     * @example
     * // returns 'https://api.fluro.io/something?access_token=2352345...'
     * fluro.api.generateEndpointURL('/something');
     */

    service.generateEndpointURL = function(path, params) {

        if (!path || !String(path).length) {
            return;
        }

        if (!params) {
            params = {};
        }

        var url = `${fluro.apiURL}${path}`;

        ////////////////////////////////////////

        url = parameterDefaults(url, params);

        ////////////////////////////////////////

        //Map the parameters to a query string
        var queryParameters = fluro.utils.mapParameters(params);

        if (queryParameters.length) {
            url += '?' + queryParameters;
        }

        return url;

    }

    ///////////////////////////////////////////////////////

    function parameterDefaults(url, params) {

        //If we haven't requested without token
        if (!params.withoutToken) {
            //Get the current token from FluroAuth
            var CurrentFluroToken = fluro.auth.getCurrentToken();

            //Check to see if we have a token and none has been explicity set
            if (!params['access_token'] && CurrentFluroToken) {
                //Use the current token by default
                params['access_token'] = CurrentFluroToken;
            }
        }

        ////////////////////////////////////

        if (fluro.app && fluro.app.uuid) {
            params['did'] = fluro.app.uuid;
        }

        return url;
    }


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
            JSON.stringify({ params: config.params, data: config.data }),
            fluro.app &&  fluro.app.user ? fluro.app.user.persona : '',
            config.application ? 'application' :'',
            config.disableUserContext ? 'disableUserContext' :'',
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