import axios from 'axios';
import {
    cacheAdapterEnhancer,
    throttleAdapterEnhancer
} from 'axios-extensions';

///////////////////////////////////////


var FluroAPI = function(fluro) {

		///////////////////////////////////////

	var service = axios.create({
        adapter: throttleAdapterEnhancer(cacheAdapterEnhancer(axios.defaults.adapter))
    });

	///////////////////////////////////////

	service.defaults.baseURL = fluro.apiURL;
    service.defaults.headers.common.Accept = 'application/json';
	
	///////////////////////////////////////

	return service;
}

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

export default FluroAPI;
