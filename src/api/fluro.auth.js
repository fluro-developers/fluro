import axios from 'axios';
import _ from 'lodash';
import { EventDispatcher } from './fluro.utils';

///////////////////////////////////////////////////


/**
 * Creates a new FluroAsset instance.
 * This module provides a number of helper functions for authentication, logging in, signing up, generating and refreshing tokens
 * 
 * @constructor
 * @param {FluroCore} fluro A reference to the parent instance of the FluroCore module. This module is usually created by a FluroCore instance that passes itself in as the first argument.
 */
var FluroAuth = function(fluro) {

    if (!fluro.api) {
        throw new Error(`Can't Instantiate FluroAuth before FluroAPI exists`);
    }

    //Keep track of any refresh requests
    var inflightRefreshRequest;

    ///////////////////////////////////////////////////

    var defaultStore = {};
    var store = defaultStore;

    ///////////////////////////////////////////////////
    ///////////////////////////////////////////////////

    var service = {
        debug:false,
    }


    //Create a new dispatcher
    var dispatcher = new EventDispatcher();
    dispatcher.bootstrap(service);

    // console.log('New Dispatcher!', dispatcher)

    ///////////////////////////////////////////////////
    ///////////////////////////////////////////////////

    function dispatch() {

        //Get the current user
        var user = store.user;

        //Dispatch the change to the listeners
        if (service.onChange) {
            service.onChange(user);
        }

        //Dispatch the change event
        dispatcher.dispatch('change', user);
    }

    ///////////////////////////////////////////////////

    function log(message) {
        if (service.debug) {
            console.log(message);
        }
    }

    ///////////////////////////////////////////////////

    /**
     * 
     * Sets the current user data, often from localStorage or after new session data
     * has been generated from the server after signing in
     * @alias fluro.auth.set
     * @param  {Object} user The user session object
     * @example
     * FluroAsset.set({firstName:'Jeff', lastName:'Andrews', ...})
     */

    service.set = function(user) {
        store.user = user;

        log('fluro.auth > user set');
        return dispatch()
    }



    ///////////////////////////////////////////////////

    /**
     * 
     * Deletes the user session object, clears all Fluro caches and tokens
     * from memory
     * @alias fluro.auth.logout
     * @example
     * fluro.auth.logout()
     */

    service.logout = function() {
        //Unauthenticated
        // delete store.token;

        delete store.user;
        fluro.cache.reset();
        // delete store.refreshToken;
        // delete store.expires;



        log('fluro.auth > user logout');


        if(fluro.withCredentials) {
            
            //Logout of the current application
            window.location.href = '/fluro/logout';
        
        
        }


          // if(window && window.localStorage) {
          //    window.localStorage.removeItem('fluro.user');
          // }

        return dispatch()

    }

    ///////////////////////////////////////////////////

    /**
     * 
     * Retrieves a new session object for a Fluro global user for a specified account
     * This will only work if the user has a persona in that account
     * @alias fluro.auth.changeAccount
     * @param  {String} accountID The _id of the account you wish to log in to
     * @param  {Object} options      
     * @param  {Object} options.disableAutoAuthenticate By default this function will set the current user session 
     * to account you are changing in to. 
     * If you want to generate the session without affecting your current session you can set disableAutoAuthenticate to true    
     * @return {Promise} Resolves to the user session object, or rejects with the responding error
     * @example
     * fluro.auth.changeAccount('5be504eabf33991239599d63').then(function(userSession) {
     *     //New user session will be set automatically
     *     var newUserSession = fluro.auth.getCurrentUser();
     * })
     * fluro.auth.changeAccount('5be504eabf33991239599d63', {disableAutoAuthenticate:true}).then(function(userSession) {
     *     //Set the session manually
     *     fluro.auth.set(userSession)
     * })
     */

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

            if (autoAuthenticate) {
                fluro.cache.reset();
                service.set(res.data);
            }
        }, function(err) {});


        return promise;

    }



    ///////////////////////////////////////////////////

    /**
     * 
     * Impersonates a persona and sets the current session to match the specified persona's context
     * @alias fluro.auth.impersonate
     * @param  {String} personaID The _id of the persona you wish to impersonate
     * @param  {Object} options      
     * @return {Promise} Resolves to the user session object, or rejects with the responding error
     * @example
     * fluro.auth.impersonate('5be504eabf33991239599d63')
     * .then(function(userSession) {
     *     //New user session will be set automatically
     *     var newUserSession = fluro.auth.getCurrentUser();
     * })
     */

    service.impersonate = function(personaID, options) {

        //Ensure we just have the ID
        personaID = fluro.utils.getStringID(personaID);

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

        var promise = fluro.api.post(`/token/persona/${personaID}`)

        promise.then(function(res) {

            if (autoAuthenticate) {
                fluro.cache.reset();
                service.set(res.data);
            }
        }, function(err) {});


        return promise;

    }

    ///////////////////////////////////////////////////
    /**
     * Logs the user in to Fluro and returns a new user session
     * @alias fluro.auth.login
     * @param  {Object} credentials 
     * @param  {String} credentials.username The email address of the user to login as
     * @param  {String} credentials.password The password for the user
     * @param  {Object} options     Extra options and configuration for the request
     * @param  {Object} options.disableAutoAuthenticate Disable automatic authentication, if true, will not set the current user session
     * @param  {Object} options.application Whether to attempt to login to the current application as a managed user persona, if not set will login as a global Fluro user
     * @return {Promise}             Returns a promise that either resolves with the logged in user session, or rejects with the responding error from the server
     */
    service.login = function(credentials, options) {

        if (!options) {
            options = {};
        }


        //////////////////////////

        //Change the users current tokens straight away
        var autoAuthenticate = true;

        if (options.disableAutoAuthenticate) {
            autoAuthenticate = false;
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

            var postOptions = {
                bypassInterceptor: true
            }

            /////////////////////////////////////////////

            var url = fluro.apiURL + '/token/login';

            /////////////////////////////////////////////

            //If we are authenticating as an application
            if (options.application) {

                //The url is relative to the domain
                url = `${fluro.domain || ''}/fluro/application/login`;
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

            fluro.api.post(url, credentials, postOptions).then(function(res) {

                if (autoAuthenticate) {
                    store.user = res.data;
                    dispatch();
                    // if (service.onChange) {
                    //     service.onChange(store.user);
                    // }
                }

                resolve(res);
            }, reject);
        }

        //////////////////////////////////////

        return promise;

    }

    ///////////////////////////////////////////////////

    /**
     * Signs up a new user to the current application, this will create a new managed user persona
     * and automatically log in as that persona in the current application context. This function will
     * only work when called in context of an application with the 'Application Token' authentication style.
     * It will create a new user persona in the account of the application and return a session with all of the application's
     * permissions and application's logged in user permissions
     * @alias fluro.auth.signup      
     * @param  {Object} credentials
     * @param  {String} credentials.firstName The first name for the new user persona
     * @param  {String} credentials.lastName The last name for the new user persona
     * @param  {String} credentials.username The email address for the new persona
     * @param  {String} credentials.password The password to set for the new persona
     * @param  {String} credentials.confirmPassword A double check to confirm the new password for the persona
     * @param  {Object} options     Extra options and configuration for the request
     * @return {Promise}            Returns a promise that either resolves to the new authenticated session, or rejects with the responding error from the server
     */
    service.signup = function(credentials, options) {

        if (!options) {
            options = {};
        }


        //////////////////////////

        //Change the users current tokens straight away
        var autoAuthenticate = true;

        if (options.disableAutoAuthenticate) {
            autoAuthenticate = false;
        }

        //////////////////////////////////////

        var promise = new Promise(signupCheck)

        function signupCheck(resolve, reject) {

            if (!credentials) {
                return reject({
                    message: 'No details provided',
                })
            }

            if (!credentials.firstName || !credentials.firstName.length) {
                return reject({
                    message: 'First Name was not provided',
                })
            }

            if (!credentials.lastName || !credentials.lastName.length) {
                return reject({
                    message: 'Last Name was not provided',
                })
            }

            if (!credentials.username || !credentials.username.length) {
                return reject({
                    message: 'Email/Username was not provided',
                })
            }


            if (!credentials.password || !credentials.password.length) {
                return reject({
                    message: 'Password was not provided',
                })
            }

            if (!credentials.confirmPassword || !credentials.confirmPassword.length) {
                return reject({
                    message: 'Confirm Password was not provided',
                })
            }

            if (credentials.confirmPassword != credentials.password) {
                return reject({
                    message: 'Your passwords do not match',
                })
            }

            /////////////////////////////////////////////

            var postOptions = {
                bypassInterceptor: true
            }

            /////////////////////////////////////////////

            var url = fluro.apiURL + '/token/signup';

            /////////////////////////////////////////////

            //If we are authenticating as an application
            if (options.application) {

                //The url is relative to the domain
                url = `${fluro.domain || ''}/fluro/application/signup`;
            }

            //If we have a specified url
            if (options.url) {
                url = options.url;
            }

            /////////////////////////////////////////////

            fluro.api.post(url, credentials, postOptions).then(function(res) {

                if (autoAuthenticate) {
                    store.user = res.data;
                    dispatch();
                }

                resolve(res);
            }, reject);
        }

        //////////////////////////////////////

        return promise;

    }


    ///////////////////////////////////////////////////

    /**
     * Retrieves a user's details by providing a password reset token 
     * @alias fluro.auth.retrieveUserFromResetToken      
     * @param  {String} token The password reset token that was sent to the user's email address
     * @param  {Object} options other options for the request
     * @param  {Boolean} options.application     If true will retrieve in the context of a managed persona in the same account as the current application.
     * If not specified or false, will assume it's a Fluro global user that is resetting their password.
     * @return {Promise}            Returns a promise that resolves with the reset session details
     */
    service.retrieveUserFromResetToken = function(token, options) {

        if (!options) {
            options = {};
        }

        //////////////////////////////////////

        return new Promise(function(resolve, reject) {

            var postOptions = {
                bypassInterceptor: true
            }

            /////////////////////////////////////////////

            //If a full fledged Fluro User
            //then send directly to the API auth endpoint
            var url = `${fluro.apiURL}/auth/token/${token}`;

            /////////////////////////////////////////////

            //If we are authenticating as an application
            if (options.application) {
                //The url is relative to the domain
                url = `${fluro.domain || ''}/fluro/application/reset/${token}`;
            }

            //If we have a specified url
            if (options.url) {
                url = options.url;
            }

            /////////////////////////////////////////////

            fluro.api.get(url, postOptions).then(function(res) {
                return resolve(res.data);
            }, reject);
        });

    }


    ///////////////////////////////////////////////////

    /**
     * Updates a user's details including password by providing a password reset token
     * @alias fluro.auth.updateUserWithToken      
     * @param  {String} token The password reset token that was sent to the user's email address
     * @param  {Object} body The details to change for the user
     * @param  {Object} options other options for the request
     * @return {Promise}            Returns a promise that resolves with the reset session details
     */
    service.updateUserWithToken = function(token, body, options) {

        if (!options) {
            options = {};
        }

        //////////////////////////

        //Change the users current tokens straight away
        var autoAuthenticate = true;

        if (options.disableAutoAuthenticate) {
            autoAuthenticate = false;
        }

        //////////////////////////////////////

        return new Promise(function(resolve, reject) {

            var postOptions = {
                bypassInterceptor: true
            }

            /////////////////////////////////////////////

            //If a full fledged Fluro User
            //then send directly to the API auth endpoint
            var url = `${fluro.apiURL}/auth/token/${token}`;

            /////////////////////////////////////////////

            //If we are authenticating as an application
            if (options.application) {
                //The url is relative to the domain
                url = `${fluro.domain || ''}/fluro/application/reset/${token}`;
            }

            //If we have a specified url
            if (options.url) {
                url = options.url;
            }



            /////////////////////////////////////////////

            fluro.api.post(url, body, postOptions).then(function(res) {

                //If we should automatically authenticate
                //once the request is successful
                //Then clear caches and update the session
                if (autoAuthenticate) {
                    fluro.cache.reset();
                    service.set(res.data);
                }

                return resolve(res.data);
            }, reject);
        });

    }


    ///////////////////////////////////////////////////

    /**
     * Triggers a new Reset Password email request to the specified user. 
     * @alias fluro.auth.sendResetPasswordRequest      
     * @param  {Object} body
     * @param  {String} body.username The email address of the user to reset the password for
     * @param  {String} body.redirect If the request is in the context of a managed user persona authenticated with an application, then you need to provide the url to direct the user to when they click the reset password link
     * This is usually something like '/reset' for the current application, when the user clicks the link the reset token will be appended with ?token=RESET_TOKEN and your application should
     * be ready on that url to handle the token and allow the user to use the token to reset their password
     * @param  {Object} options     Extra options and configuration for the request
     * @param  {Boolean} options.application     If true will send a reset email from the context of a managed persona in the same account as the current application.
     * If not specified or false, will send a password reset request for a global Fluro user account.
     * @return {Promise}            Returns a promise that either resolves if the password request was sent, or rejects if an error occurred
     */
    service.sendResetPasswordRequest = function(body, options) {

        if (!options) {
            options = {};
        }

        //////////////////////////////////////

        var promise = new Promise(signupCheck)

        function signupCheck(resolve, reject) {

            if (!body) {
                return reject({
                    message: 'No details provided',
                })
            }

            if (!body.username || !body.username.length) {
                return reject({
                    message: 'Email/Username was not provided',
                })
            }

            //Set username as the email address
            body.email = body.username;

            /////////////////////////////////////////////

            var postOptions = {
                bypassInterceptor: true
            }

            /////////////////////////////////////////////

            //If a full fledged Fluro User
            //then send directly to the API
            var url = fluro.apiURL + '/auth/resend';

            /////////////////////////////////////////////

            //If we are authenticating as an application
            if (options.application) {

                //The url is relative to the domain
                url = `${fluro.domain || ''}/fluro/application/forgot`;
            }

            //If we have a specified url
            if (options.url) {
                url = options.url;
            }

            /////////////////////////////////////////////

            fluro.api.post(url, body, postOptions).then(resolve, reject);
        }

        //////////////////////////////////////

        return promise;

    }


    ///////////////////////////////////////////////////


    var refreshContext = {};

    /**
     * Helper function to refresh an access token for an authenticated user session. This is usually handled automatically
     * from the FluroAuth service itself
     * @alias fluro.auth.refreshAccessToken
     * @param  {String}  refreshToken  The refresh token to reactivate
     * @param  {Boolean} isManagedSession Whether or not the refresh token is for a managed persona session or a global Fluro user session
     * @return {Promise}                A promise that either resolves with the refreshed token details or rejects with the responding error from the server
     */
    service.refreshAccessToken = function(refreshToken, isManagedSession) {

        //If there is already a request in progress
        if (refreshContext.inflightRefreshRequest) {
            //console.log('Use inflight request', refreshContext.inflightRefreshRequest);
            return refreshContext.inflightRefreshRequest;
        }

        /////////////////////////////////////////////////////

        //Create an refresh request
        refreshContext.inflightRefreshRequest = new Promise(function(resolve, reject) {

            log(`fluro.auth > refresh token ${refreshToken}`);

            //Bypass the interceptor on all token refresh calls
            //Because we don't need to add the access token etc onto it
            fluro.api.post('/token/refresh', {
                    refreshToken: refreshToken,
                    managed: isManagedSession,
                }, {
                    bypassInterceptor: true,
                })
                .then(function tokenRefreshComplete(res) {

                    console.log('TOKEN REFRSH COMPLETE',res)

                    //Update the user with any changes 
                    //returned back from the refresh request
                    if (!res) {
                        log('fluro.auth > no res');
                        refreshContext.inflightRefreshRequest = null;
                        return reject();

                    } else {

                        if (store.user) {
                            Object.assign(store.user, res.data);
                        } else {
                            store.user = res.data;
                        }

                        log('fluro.auth > token refreshed');


                        // if (service.onChange) {
                        //     service.onChange(store.user);
                        // }
                        dispatch();
                        // }
                    }

                    //Resolve with the new token
                    resolve(res.data.token);

                    //Remove the inflight request
                    refreshContext.inflightRefreshRequest = null;

                })
                .catch(function(err) {
                    console.log('TOKEN REFRESH FAILED', err);

                    //console.log('Refresh request Failed')
                    refreshContext.inflightRefreshRequest = null;
                    reject(err);

                    console.log('TOKEN REFRSH ERROR',err)

                });
        });

        //Return the refresh request
        return refreshContext.inflightRefreshRequest;
    }



    ///////////////////////////////////////////////////



    /**
     * Helper function to resync the user's session from the server. This is often used when first loading a webpage or app
     * just to see if the user's permissions have changed since the user first logged in
     * from the FluroAuth service itself
     * @alias fluro.auth.sync
     * @return {Promise}    A promise that either resolves with the user session 
     */
    service.sync = function() {

        console.log('Sync with server')

        return fluro.api.get('/session')
            .then(function(res) {

                if (res.data) {

                    //Update the user with any changes 
                    //returned back from the refresh request
                    if (store.user) {
                        Object.assign(store.user, res.data);
                    }
                } else {
                    store.user = null;
                }
                log('fluro.auth > server session refreshed');

                dispatch();
            })
            .catch(function(err) {
                console.log('Auth Sync Error',err);
                store.user = null;
                dispatch();

            });
    }

    /////////////////////////////////////////////////////

    /**
     * Returns the current user's access token
     * @alias fluro.auth.getCurrentToken
     * @return {String} The Fluro access token for the current user session
     */
    service.getCurrentToken = function() {
        return _.get(store, 'user.token') || fluro.applicationToken;
    }

    /////////////////////////////////////////////////////

    /**
     * Returns the current user's session data
     * @alias fluro.auth.getCurrentUser
     * @return {Object} The current user session
     */
    service.getCurrentUser = function() {
        return _.get(store, 'user');
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
        now.setSeconds(now.getSeconds() + 10);


        var expiryDate = _.get(store, 'user.expires');
        var expires = new Date(expiryDate);

        //If we are not debugging
        if (!service.debug) {

            //If the token is still fresh
            if (now < expires) {
                //Return the original request
                return originalRequest;
            }
        }

        /////////////////////////////////////////////////////

        var isManagedUser = _.get(store, 'user.accountType') == 'managed';
        //The token is stale by this point

        log('fluro.auth > token expired');

        return new Promise(function(resolve, reject) {

            //Refresh the token
            service.refreshAccessToken(refreshToken, isManagedUser)
                .then(function(newToken) {
                    log('fluro.auth > token refreshed', isManagedUser);
                    //Update the original request with our new token
                    originalRequest.headers['Authorization'] = 'Bearer ' + newToken;
                    //And continue onward
                    return resolve(originalRequest);
                })
                .catch(function(err) {
                    console.log('ERRRRRR', err);
                    log('fluro.auth > token refresh rejected', err);
                    return reject(err);
                });
        });


    }, function(error) {
        return Promise.reject(error);
    })

    /////////////////////////////////////////////////////

    fluro.api.interceptors.response.use(function(response) {
        return response;
    }, function(err) {

        //Get the response status
        var status = _.get(err, 'response.status') || err.status;

        log('fluro.auth > error', status);
        switch (status) {
            case 401:

                // console.log('AUTH ERROR 401', err);

                //If it's an invalid refresh token
                //In case it was a mismatch between tabs or sessions
                //we should try it a second time just in case
                var data = _.get(err, 'response.data');
                if(data == 'invalid_refresh_token') {

                    //Try it again
                    // console.log('Refresh failed but its ok')

                } else {
                    //Logout and destroy the session
                    
                }

                service.logout();
            
                
                break;
            default:
                //Some other error
                break;
        }

        /////////////////////////////////////////////////////
        
        return Promise.reject(err);
    })


    /**
     * @name fluro.auth.addEventListener
     * @description Adds a callback that will be triggered whenever the specified event occurs
     * @function
     * @param {String} event The event to listen for
     * @param {Function} callback The function to fire when this event is triggered
     * @example
     * //Listen for when the user session changes
     * fluro.auth.addEventListener('change', function(userSession) {})
     */

    /**
     * @name fluro.auth.removeEventListener
     * @description Removes all a callback from the listener list
     * @function
     * @param {String} event The event to stop listening for
     * @param {Function} callback The function to remove from the listener list
     * @example
     * //Stop listening for the change event
     * fluro.auth.removeEventListener('change', myFunction)
     */

    /**
     * @name fluro.auth.removeAllListeners
     * @description Removes all listening callbacks for all events
     * @function
     * @example
     * fluro.auth.removeAllListeners()
     */

    return service;

}


export default FluroAuth;