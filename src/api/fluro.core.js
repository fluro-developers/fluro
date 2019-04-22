import FluroAPI from './fluro.api';
import FluroAuth from './fluro.auth';
import FluroAsset from './fluro.asset';
import FluroUtils from './fluro.utils';
import FluroCache from './fluro.cache';
import FluroDate from './fluro.date';
import FluroStats from './fluro.stats';
import FluroTypes from './fluro.types';
import FluroContent from './fluro.content';

///////////////////////////////////////

/**
 * Creates a new FluroCore instance including all of the default sub modules
 * 
 * @constructor
 * 
 * @param {Object} options 
 * @param {String} options.apiURL    The remote URL of the Fluro API you want to connect to. Options are 'staging', 'production' or you may set a specific URL eg. 'https://api.fluro.io' (do not include trailing slash). If no value is provided, will default to 'production'.
 * @param {String} options.applicationToken When running as a static application, (for example a website) you may set the application's access token before you initialize the Fluro instance here.  
 */
var FluroCore = function(options) {

    if (!options) {
        options = {
            // apiURL,
            // applicationToken,
            // api:{}
        };
    }

    ///////////////////////////////////////

    if (!options.apiURL || !options.apiURL.length) {
        options.apiURL = 'production';
    }

    ///////////////////////////////////////

    switch (options.apiURL) {
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
        apiURL: options.apiURL,
        applicationToken: options.applicationToken,
        domain:options.domain || '',
    }


    ///////////////////////////////////////

    /**
     * Provides a cache service, used for creating, clearing 
     * and storing API requests and other information in memory
     * @type {FluroCache}
     */
    var cache = FluroCache;
    Object.defineProperty(core, 'cache', {
        value: cache,
        writable: false,
    });
    ///////////////////////////////////////

    /**
     * Provides helper functions for working
     * with Fluro data
     * @type {FluroUtils}
     */
    var utils = FluroUtils;
    Object.defineProperty(core, 'utils', {
        value: utils,
        writable: false,
    });

    /**
     * Provides date functions, filters and utilities
     * for working with dates and timezones
     * @type {FluroDate}
     */
    var date = FluroDate;
    Object.defineProperty(core, 'date', {
        value: date,
        writable: false,
    });

    /**
     * The default service for interacting with
     * the Fluro REST API, it's a wrapper around the axios library
     * that works in conjunction with the other Fluro modules
     * @type {FluroAPI}
     */
    var api = new FluroAPI(core);
    Object.defineProperty(core, 'api', {
        value: api,
        writable: false,
    });

    /**
     * A helper service for CRUD operations that wraps around the fluro.api service
     * @type {FluroContent}
     */
    var content = new FluroContent(core);
    Object.defineProperty(core, 'content', {
        value: content,
        writable: false,
    });

    /**
     * The default service for managing authentication
     * handles automatic refreshing of access tokens, and provides login, logout
     * and other user/application specific functionality
     * @type {FluroAuth}
     */
    var auth = new FluroAuth(core);
    Object.defineProperty(core, 'auth', {
        value: auth,
        writable: false,
    });

    /**
     * The default service for managing, rendering and handling files and media from Fluro.
     * It contains helper functions for managing connecting to image, audio, asset and video api endpoints.
     * @type {FluroAsset}
     */
    var asset = new FluroAsset(core);
    Object.defineProperty(core, 'asset', {
        value: asset,
        writable: false,
    });


    /**
     * The default service for handling a user's 'stats' eg. (likes, views, favorites, downvotes etc...)
     * This service creates and syncs user's stats when they 'stat' items from Fluro.
     * @type {FluroStats}
     */
    var stats = new FluroStats(core)
    Object.defineProperty(core, 'stats', {
        value: new FluroStats(core),
        writable: false,
    });

    /**
     * A helper service for retrieving, translating and rendering content types and definitions
     * defined within Fluro. 
     * @type {FluroTypes}
     */
    var types = new FluroTypes(core);
    Object.defineProperty(core, 'types', {
        value: types,
        writable: false,
    });

    ///////////////////////////////////////


    return core;

}

///////////////////////////////////////
///////////////////////////////////////
///////////////////////////////////////

export default FluroCore;