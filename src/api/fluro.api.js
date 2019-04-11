import axios from 'axios';
import {
    cacheAdapterEnhancer,
    throttleAdapterEnhancer,
    Cache,
} from 'axios-extensions';

///////////////////////////////////////


var FluroAPI = function(fluro) {


    ///////////////////////////////////////

    // //Cache Defaults
    // var FIVE_MINUTES = 1000 * 60 * 5;
    // var CAPACITY = 100;
    // { maxAge: FIVE_MINUTES, max: 100 }
    var defaultCache = new Cache()

    // ///////////////////////////////////////

    // //Add it to our fluro instance
    fluro.cache = defaultCache;
    
    ///////////////////////////////////////

    var service = axios.create({
        adapter: throttleAdapterEnhancer(cacheAdapterEnhancer(axios.defaults.adapter, {defaultCache:defaultCache}))
    });



    ///////////////////////////////////////

    // var service = axios.create({
    //     adapter: throttleAdapterEnhancer(cacheAdapterEnhancer(axios.defaults.adapter))
    // });

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