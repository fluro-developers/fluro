
///////////////////////////////////////////////////

var FluroAuth = function(Fluro) {

    if(!Fluro.api) {
        throw new Error(`Can't Instantiate FluroAuth before FluroAPI exists`);
    }

    //Keep track of any refresh requests
    var inflightRefreshRequest;

    ///////////////////////////////////////////////////

    var service = {}

    ///////////////////////////////////////////////////

    service.refreshAccessToken = function(refreshToken) {

        //If there is already a request in progress
        if (inflightRefreshRequest) {
            return inflightRefreshRequest;
        }

        /////////////////////////////////////////////////////

        //Create an refresh request
        inflightRefreshRequest = new Promise(function(resolve, reject) {


            //Bypass the interceptor on all token refresh calls
            //Because we don't need to add the access token etc onto it
            Fluro.api.post('token/refresh', {
                    refreshToken: refreshToken
                }, {
                    bypassInterceptor: true
                })
                .then(function tokenRefreshComplete(res) {

                    //Save the user data
                    service.user = res.data;
                    service.token = res.data.token;
                    service.refreshToken = res.data.refreshToken;
                    service.expires = res.data.expires;

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
        return service.token || Fluro.applicationToken;
    }

    /////////////////////////////////////////////////////

    Fluro.api.interceptors.request.use(function(config){

        //If we want to bypass the interceptor
        //then just return the request
        if (config.bypassInterceptor) {
            return config;
        }

        //////////////////////////////

        //Get the original request
        var originalRequest = config;

        //If we aren't logged in or don't have a token
        var token = service.token;
        var refreshToken = service.refreshToken;

        //////////////////////////////

        //If there is a user token
        if (token) {

            //Set the token of the request as the user's access token
            originalRequest.headers['Authorization'] = 'Bearer ' + token;

        } else if (Fluro.applicationToken && Fluro.applicationToken.length) {

            //If there is a static application token
            //For example we have logged out from a website
            //that has public content also
            originalRequest.headers['Authorization'] = 'Bearer ' + Fluro.applicationToken;

            return originalRequest;

        } else {
            //Return the original request without a token
            return originalRequest;
        }

        /////////////////////////////////////////////////////

        //If no refresh token
        if (!refreshToken) {
            //Continue with the original request
            return originalRequest;
        }

        /////////////////////////////////////////////////////

        //We have a refresh token so we need to check
        //whether our access token is stale and needs to be refreshed
        var now = new Date();
        var expires = new Date(service.expires);

        //If the token is still fresh
        if (now < expires) {
            //Return the original request
            return originalRequest;
        }

        /////////////////////////////////////////////////////

        //The token is stale by this point
        console.log('Token expired');

        return new Promise(function(resolve, reject) {

            //Refresh the token
            service.refreshAccessToken(refreshToken)
                .then(function(newToken) {
                    console.log('Token refreshed');
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

    Fluro.api.interceptors.response.use(function(response) {
        return response;
    }, function(err) {

        //Get the response status
        var status = err.response.status;


        switch (status) {
            case 401:
                //Unauthenticated
                delete service.token;
                delete service.user;
                delete service.refreshToken;
                delete service.expires;
                break;
            case 502:
                // case 503:
            case 504:
                //Retry
                console.log('Retry request')
                return Fluro.api.request(err.config);
                break;
            default:
                //Some other error
                break;
        }

        /////////////////////////////////////////////////////
        /// 
        return Promise.reject(err);
    })

}


export default FluroAuth;