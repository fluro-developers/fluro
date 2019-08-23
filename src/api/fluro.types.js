import _ from 'lodash';

///////////////////////////////////////////////////////////////////////////////

/**
 * Creates a new FluroTypes service
 * This module provides a number of helpful functions for retrieving, translating and understanding types, schemas and definitions
 * that are defined within Fluro
 * 
 * @constructor
 * @param {FluroCore} fluro A reference to the parent instance of the FluroCore module. This module is usually created by a FluroCore instance that passes itself in as the first argument.
 */
var FluroTypes = function(FluroCore) {


    var service = {};

    //////////////////////////////////

    service.icon = function(type, library) {

        if (!library) {
            library = 'far';
        }

        var icon;
        switch (type) {
            case 'policy':
                icon = 'id-card';
                break;
            case 'account':
                icon = 'browser';
                break;
            case 'application':
                icon = 'layer-group';
                break;
            case 'article':
                icon = 'file-alt';
                break;
            case 'asset':
                icon = 'file-archive';
                break;
            case 'audio':
                icon = 'file-audio';
                break;
            case 'checkin':
                icon = 'sign-in';
                break;
            case 'code':
                icon = 'code';
                break;
            case 'collection':
                // icon = 'box-full';
                icon = 'folder';
                break;
            case 'component':
                icon = 'tachometer-alt';
                break;
            case 'contact':
                icon = 'child';
                break;
            case 'definition':
                icon = 'books-medical';
                break;
            case 'contactdetail':
                icon = 'file-invoice';
                break;
            case 'eventtrack':
                icon = 'random';
                break;
            case 'event':
                icon = 'calendar-star';
                break;
            case 'family':
                icon = 'home';
                break;
            case 'team':
                icon = 'users';
                break;
            case 'attendance':
                icon = 'calendar-check';
                break;
            case 'image':
                icon = 'image';
                break;



            case 'integration':
                icon = 'plug';
                break;
            case 'interaction':
                icon = 'compress';
                break;
            case 'location':
                icon = 'map-marked-alt';
                break;
            case 'mailout':
                icon = 'paper-plane';
                break;
            case 'plan':
                icon = 'clipboard-list';
                break;
            case 'post':
                icon = 'sticky-note';
                break;
            case 'process':
                icon = 'exchange';
                break;
            case 'product':
                icon = 'shopping-cart';
                break;
            case 'purchase':
                icon = 'file-invoice-dollar';
                break;
            case 'query':
                icon = 'terminal';
                break;
            case 'reaction':
                icon = 'bolt';
                break;
            case 'realm':
                icon = 'bullseye';
                break;
            case 'role':
                icon = 'user-lock';
                break;
            case 'site':
                icon = 'sitemap';
                break;
            case 'tag':
                icon = 'tag';
                break;
            case 'ticket':
                icon = 'ticket-alt';
                break;
            case 'transaction':
                icon = 'usd-square';
                break;
            case 'persona':
                icon = 'user';
                break;
            case 'video':
                icon = 'video';
                break;
        }

        if (icon) {
            return [library, icon];
        }
    }


    //////////////////////////////////

    /**
     * Retrieves a specified definition or primitive type object
     * @alias FluroTypes.get
     * @param  {string} definedName The definition or type name you want to retrieve
     * @param  {object} options extra options for the request
     * @return {promise}       An promise that will resolve to the type definition from Fluro
     */
    service.get = function(definedName, options) {

        if (!options) {
            options = {
                // flat:true
            }
        }

        ///////////////////////////

        return new Promise(function(resolve, reject) {

            FluroCore.api.get(`/defined/type/${definedName}`, options)
                .then(function(res) {
                    resolve(res.data);
                }, reject);

        });

    }

    //////////////////////////////////

    /**
     * Retrieves all definitions available in the current account. Useful for making one request and caching
     * @alias FluroTypes.all
     * @param  {object} options extra options for the request
     * @return {promise}       An promise that will resolve to the array of definitions
     */
    service.all = function(options) {

        if (!options) {
            options = {
                // flat:true
            }
        }

        ///////////////////////////

        return new Promise(function(resolve, reject) {

            return FluroCore.api.get(`/defined}`, options)
                .then(function(res) {
                    resolve(res.data);
                }, reject);
        });

    }


    //////////////////////////////////

    /**
     * Retrieves a list of specified types and their respective definitions
     * @alias FluroTypes.retrieve
     * @param  {array} types The names of the basic types you want to retrieve
     * @return {promise}       An promise that will resolve to the matching basic types or reject with the responding error
     */
    service.retrieve = function(types, options) {

        if (!options) {
            options = {
                // flat:true
            }
        }

        options.types = types;

        ///////////////////////////

        return new Promise(function(resolve, reject) {

            FluroCore.api.post('/defined', options)
                .then(function(res) {

                    console.log('GOT ALL THE TYPES', res.data);
                    resolve(res.data);
                }, reject);

        });

    }

    // //////////////////////////////////

    //   //Get all sub definitions for an array of primitive types
    // service.subDefinitions = function(primitiveTypes, options) {

    //     if (!options) {
    //         options = {
    //             // flat:true
    //         }
    //     }


    //     var definitionCache = fluro.cache.get('subDefinitions');

    //     ////////////////////////////////////////////////////////

    //     var promises = _.map(primitiveTypes, function(type) {
    //         if(definitionCache[type]) {
    //             return Promise.resolve(definitionCache[type]);
    //         }

    //         ///////////////////////////////////////////////////

    //         return new Promise(function(resolve, reject) {

    //              FluroCore.api.get(`/defined/types/${type}`)
    //             .then(function(res) {

    //                 definitionCache[type] = res.data;
    //                 resolve(definitionCache[type]);
    //             }, reject);

    //         });
    //     })

    //     return Promise.all(promises);
    // }    

    //////////////////////////////////

    return service;

}

///////////////////////////////////////////////////////////////////////////////



export default FluroTypes;