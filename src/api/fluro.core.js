

import FluroAPI from './fluro.api';
import FluroAuth from './fluro.auth';
import FluroAsset from './fluro.asset';
import FluroUtils from './fluro.utils';
import FluroCache from './fluro.cache';
import FluroDate from './fluro.date';
import FluroStats from './fluro.stats';
import FluroTypes from './fluro.types';

///////////////////////////////////////

var FluroCore = function(options) {

	if(!options) {
		options = {
			// apiURL,
			// applicationToken,
			// api:{}
		};
	}

	///////////////////////////////////////

	if(!options.apiURL || !options.apiURL.length) {
		options.apiURL = 'production';
	}

	///////////////////////////////////////

	switch(options.apiURL) {
		case 'production':
			options.apiURL = 'https://api.fluro.io';
		break;
		case 'staging':
			options.apiURL = 'https://api.staging.fluro.io';
		break;
		case 'local':
			options.apiURL = 'http://api.fluro.localhost:3000';
		break;
	}


	///////////////////////////////////////

	var core = {
		apiURL:options.apiURL,
		applicationToken:options.applicationToken,
	}

	
	///////////////////////////////////////

	Object.defineProperty(core, 'cache', {
		value:FluroCache,
		writable:false,
	});
	///////////////////////////////////////

	Object.defineProperty(core, 'utils', {
		value:FluroUtils,
		writable:false,
	});

	Object.defineProperty(core, 'date', {
		value:FluroDate,
		writable:false,
	});

	Object.defineProperty(core, 'api', {
		value:new FluroAPI(core),
		writable:false,
	});

	Object.defineProperty(core, 'auth', {
		value:new FluroAuth(core),
		writable:false,
	});

	Object.defineProperty(core, 'asset', {
		value:new FluroAsset(core),
		writable:false,
	});


	Object.defineProperty(core, 'stats', {
		value:new FluroStats(core),
		writable:false,
	});


	Object.defineProperty(core, 'types', {
		value:new FluroTypes(core),
		writable:false,
	});

	///////////////////////////////////////

	
	return core;

}

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

export default FluroCore;
