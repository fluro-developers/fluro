import axios from 'axios';

///////////////////////////////////////////////////

var FluroAuth = function(fluro) {

    console.log('FLURO', fluro)
    if (!fluro.api) {
        throw new Error(`Can't Instantiate FluroAuth before FluroAPI exists`);
    }

    //Keep track of any refresh requests
    var inflightRefreshRequest;

    ///////////////////////////////////////////////////

    var defaultStore = {};
    var store = defaultStore;


    ///////////////////////////////////////////////////

    var service = {}

    ///////////////////////////////////////////////////

    function log(message) {
        if (service.debug) {
            console.log(message);
        }
    }

    ///////////////////////////////////////////////////

    service.set = function(user) {
        store.user = user;

        log('fluro.auth > user set');

        if (service.onChange) {
            service.onChange(store.user);
        }
    }

    ///////////////////////////////////////////////////

    service.logout = function() {
        //Unauthenticated
        // delete store.token;

        delete store.user;
        fluro.cache.reset();
        // delete store.refreshToken;
        // delete store.expires;

        log('fluro.auth > user logout');

        if (service.onChange) {
            service.onChange(store.user);
        }

    }

    ///////////////////////////////////////////////////

    // console.log('Registered!!!')
    service.changeAccount = function(accountID, options) {

        //Ensure we just have the ID
        accountID = fluro.utils.getStringID(accountID);

        //////////////////////////

        if (!options) {
            options = {};
        }

        //////////////////////////

        //Change the users current tokens straight away
        var autoAuthenticate = true;

        if (options.disableAutoAuthenticate) {
            autoAuthenticate = false;
        }

        //////////////////////////

        var promise = fluro.api.post(`/token/account/${accountID}`)

        promise.then(function(res) {
            store.user = res.data;
            
            fluro.cache.reset();

            if (service.onChange) {
                service.onChange(store.user);
            }
        }, function(err) {
            console.log('ERROR', err);
        });


        return promise;

    }

    ///////////////////////////////////////////////////

    service.login = function(credentials, options) {

        if (!options) {
            options = {};
        }

        //////////////////////////////////////

        var promise = new Promise(loginCheck)

        function loginCheck(resolve, reject) {

            if (!credentials) {
                return reject({
                    message: 'Missing credentials!',
                })
            }

            if (!credentials.username || !credentials.username.length) {
                return reject({
                    message: 'Username was not provided',
                })
            }

            if (!credentials.password || !credentials.password.length) {
                return reject({
                    message: 'Password was not provided',
                })
            }

            /////////////////////////////////////////////

            var url = fluro.apiURL + '/token/login';

            /////////////////////////////////////////////

            //If we are authenticating as an application
            if (options.application) {

                //The url is relative to the domain
                url = '/fluro/application/login';
            }


            /////////////////////////////////////////////

            //If we are logging in to a managed account use a different endpoint
            if (options.managedAccount) {
                url = fluro.apiURL + '/managed/' + options.managedAccount + '/login';
            }

            //If we have a specified url
            if (options.url) {
                url = options.url;
            }

            /////////////////////////////////////////////

            fluro.api.post(url, credentials, {
                bypassInterceptor: true
            }).then(function(res) {
                store.user = res.data;
                if (service.onChange) {
                    service.onChange(store.user);
                }
            }, reject);
        }

        //////////////////////////////////////

        return promise;

    }

    ///////////////////////////////////////////////////

    service.refreshAccessToken = function(refreshToken) {

        //If there is already a request in progress
        if (inflightRefreshRequest) {
            return inflightRefreshRequest;
        }

        /////////////////////////////////////////////////////

        //Create an refresh request
        inflightRefreshRequest = new Promise(function(resolve, reject) {

            log('fluro.auth > refresh token');


            //Bypass the interceptor on all token refresh calls
            //Because we don't need to add the access token etc onto it
            fluro.api.post('token/refresh', {
                    refreshToken: refreshToken
                }, {
                    bypassInterceptor: true
                })
                .then(function tokenRefreshComplete(res) {

                    //Update the user with any changes 
                    //returned back from the refresh request
                    Object.assign(store.user, res.data);
                    log('fluro.auth > token refreshed');


                    if (service.onChange) {
                        service.onChange(store.user);
                    }

                    //Resolve with the new token
                    resolve(res.data.token);

                    //Remove the inflight request
                    inflightRefreshRequest = null;

                }, reject);
        });

        //Return the refresh request
        return inflightRefreshRequest;
    }


    /////////////////////////////////////////////////////

    service.getCurrentToken = function() {
        return _.get(store, 'user.token') || fluro.applicationToken;
    }

    /////////////////////////////////////////////////////

    fluro.api.interceptors.request.use(function(config) {

        //If we want to bypass the interceptor
        //then just return the request
        if (config.bypassInterceptor) {
            return config;
        }

        //////////////////////////////

        //Get the original request
        var originalRequest = config;

        //If we aren't logged in or don't have a token
        var token = _.get(store, 'user.token');
        var refreshToken = _.get(store, 'user.refreshToken');

        //////////////////////////////

        //If there is a user token
        if (token) {

            //Set the token of the request as the user's access token
            originalRequest.headers['Authorization'] = 'Bearer ' + token;
            log('fluro.auth > using user token');


        } else if (fluro.applicationToken && fluro.applicationToken.length) {

            //If there is a static application token
            //For example we have logged out from a website
            //that has public content also
            originalRequest.headers['Authorization'] = 'Bearer ' + fluro.applicationToken;

            log('fluro.auth > using app token');

            return originalRequest;

        } else {
            //Return the original request without a token
            log('fluro.auth > no token');

            return originalRequest;
        }

        /////////////////////////////////////////////////////

        //If no refresh token
        if (!refreshToken) {
            log('fluro.auth > no refresh token');

            //Continue with the original request
            return originalRequest;
        }

        /////////////////////////////////////////////////////

        //We have a refresh token so we need to check
        //whether our access token is stale and needs to be refreshed
        var now = new Date();

        //Give us a bit of buffer incase some of our images
        //are still loading
        now.setSeconds(now.getSeconds() + 5);


        var expiryDate = _.get(store, 'user.expires');
        var expires = new Date(expiryDate);

        //If the token is still fresh
        if(!service.debug) {
            if (now < expires) {
                //Return the original request
                return originalRequest;
            }
        }

        /////////////////////////////////////////////////////

        //The token is stale by this point

        log('fluro.auth > token expired');

        return new Promise(function(resolve, reject) {

            //Refresh the token
            service.refreshAccessToken(refreshToken)
                .then(function(newToken) {
                    log('Token refreshed');
                    //Update the original request with our new token
                    originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
                    //And continue onward
                    return resolve(originalRequest);
                }, reject);
        });


    }, function(error) {
        return Promise.reject(error);
    })

    /////////////////////////////////////////////////////

    fluro.api.interceptors.response.use(function(response) {
        return response;
    }, function(err) {

        //Get the response status
        var status = err.response.status;

        log('fluro.auth > error', status);
        switch (status) {
            case 401:
                service.logout();
                break;
            default:
                //Some other error
                break;
        }

        /////////////////////////////////////////////////////
        /// 
        return Promise.reject(err);
    })

    return service;

}


export default FluroAuth;