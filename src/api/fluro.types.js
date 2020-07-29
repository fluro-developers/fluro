import _ from 'lodash';

///////////////////////////////////////////////////////////////////////////////

/**
 * Creates a new FluroTypes service
 * This module provides a number of helpful functions for retrieving, translating and understanding types, schemas and definitions
 * that are defined within Fluro
 * @alias fluro.types
 * @constructor
 * @param {FluroCore} fluro A reference to the parent instance of the FluroCore module. This module is usually created by a FluroCore instance that passes itself in as the first argument.
 */
var FluroTypes = function(FluroCore) {


    var service = {
        glossary: {},
    };

    //////////////////////////////////

    service.icon = function(type, library) {

        if (!library) {
            library = 'far';
        }

        var icon;
        switch (type) {
            case 'academic':
                icon = 'school';
                break;
            case 'deployment':
                icon = 'cloud-upload';
                break;
            case 'roster':
                icon = 'clipboard-user';
                break;
            case 'package':
                icon = 'box-open';
                break;
            case 'method':
                icon = 'credit-card-front';
                break;
            case 'resultset':
                icon = 'poll-people';
                break;
            case 'timetrigger':
                icon = 'clock';
                break;
            case 'user':
                icon = 'user';
                break;
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
            case 'capability':
                icon = 'star';
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
            case 'log':
                icon = 'history';
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
                icon = 'comment-alt-lines';
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
            case 'form':
                icon ='file-signature';
            break;
        }

        if (icon) {
            return [library, icon];
        }
    }


    //////////////////////////////////

    /**
     * Retrieves a specified definition or primitive type object
     * @alias fluro.types.get
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



    ///////////////////////////////////////////////////////////////////////////////

    /**
     * A helpful function for mapping an array of items into a grouped array broken up by definition
     * @alias fluro.types.mapDefinitionItems
     * @param  {Array} array An array of content items
     * @param  {String} baseType The default base type to map, eg. 'tag', 'contact', 'event'
     * @return {Array}            A mapped array broken up by definition
     * @example 
     * //Returns {something:[{title:'Demographic', plural:'Demographics',  key:'demographic', entries:[{...},{...}]}]}
     * fluro.types.mapDefinitionItems([{title:'test', definition:'demographic'}], 'tag');
     * 
     */
    service.mapDefinitionItems = function(array, backup) {

        var self = this;

        ////////////////////////////

        if (!array || !array.length) {
            return [];
        }

        ////////////////////////////

        return _.chain(array)
            // .orderBy(function(item) {
            //     return String(item.title).toLowerCase()
            // })
            .reduce(function(set, entry) {

                var key = entry.definition || backup;
                var existing = set[key];
                if (!existing) {
                    existing = set[key] = {
                        title: service.readable(key, false, backup),
                        plural: service.readable(key, true, backup),
                        key,
                        entries: [],
                    }
                }
                existing.entries.push(entry);
                return set;
            }, {})
            .values()
            .orderBy(function(type) {
                return type.key == backup
            })
            .value();
    }

    //////////////////////////////////

    /**
     * Retrieves all definitions available in the current account. Useful for making one request and caching
     * @alias fluro.types.all
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

            return FluroCore.api.get(`/defined`, options)
                .then(function(res) {
                    resolve(res.data);
                }, reject);
        });

    }


    //////////////////////////////////
    /**
     * Retrieves all definitions available in the current account. Useful for making one request and caching
     * @alias fluro.types.terms
     * @param  {object} options extra options for the request
     * @return {promise}       An promise that will resolve to the array of definitions and their names
     */

    var inflightTermsRequest;

    //////////////////////////////////



    service.terms = function(options) {

        if(!options) {
            options = {}
        }

        // console.log('LETS LOAD TERMS', options, FluroCore.auth.getCurrentUser());


        ///////////////////////////

        if (inflightTermsRequest && !options.forceRefresh) {
            return inflightTermsRequest;
        }

        ///////////////////////////

        inflightTermsRequest = new Promise(function(resolve, reject) {

            if (!options) {
                options = {
                    cache:false,
                    // flat:true
                }
            }

            ///////////////////////////

            options.cache = false;


            ///////////////////////////

            service.glossary = {};

            return FluroCore.api.get(`/defined/terms`, options).then(function(res) {
                _.each(res.data, function(entry, key) {
                    entry.definitionName = key;
                });
                
                service.glossary = res.data;
                return resolve(res.data);
            }, reject);
        });

        ///////////////////////////

        return inflightTermsRequest;
    }



   

    //////////////////////////////////





    /**
     * Retrieves a glossary of glossary for readable definition titles and plurals
     * @alias fluro.types.reloadTerminology
     * @return {promise}       An promise that will resolve to the matching basic types or reject with the responding error
     */
   
    service.reloadTerminology = function(options) {

        if (!options) {
            options = {
                forceRefresh:true,
            }
        }
         // console.log('load terms reloadTerminology')
        return service.terms(options);
    }
   

    //////////////////////////////////

    var basicTypes = [
        'asset',
        'checkin',
        'image',
        'audio',
        'video',
        'account',
        'persona',
        'application',
        'deployment',
        'article',
        'assignment',
        'post',
        'resultset',
        'timetrigger',
        'onboard',
        'code',
        'component',
        'collection',
        'family',
        'contact',
        'method',
        'contactdetail',
        'personadetail',
        'task',
        'definition',
        'endpoint',
        'event',
        'view',
        'process',
        'eventtrack',
        'log',
        'integration',
        'interaction',
        'location',
        'package',
        'product',
        'purchase',
        'query',
        'realm',
        'role',
        'site',
        'tag',
        'team',
        'roster',
        'capability',
        'plan',
        'transaction',
        'reaction',
        'user',
        'policy',
        'mailout',
        'ticket',
        'academic',
        'attendance',
    ]


    service.isBasicType = function(typeName) {
        return _.includes(basicTypes, typeName);
    }

    //////////////////////////////////

    /**
     * Input a definition name or basic type and receive the human readable version of that type
     * @alias fluro.types.readable
     * @param  {String} definitionName The definition or _type
     * @param  {Boolean} plural Whether to return it's plural version
     * @return {String}  Eg. 'Audio', 'Detail Sheet', or 'Events'...
     */
    service.readable = function(definitionName, plural) {

        if(definitionName == 'node') {
            return plural ? 'Items' : 'Item';
        }

        //////////////////////////////////////////

        var readable = definitionName;
        var match = service.glossary ? service.glossary[readable] : null;

        if (match) {
            readable = plural ? match.plural : match.title;
        } else {
            readable = plural ? _.startCase(readable) + 's' : _.startCase(readable);
        }

        return readable;
    }


    //////////////////////////////////

    /**
     * Input a definition name or basic type and receive the basic details about that definition
     * @alias fluro.types.term
     * @param  {String} definitionName The definition or _type
     * @return {Object}  The details about this definition as defined in the glossary
     */
    service.term = function(definitionName) {

        return service.glossary ? service.glossary[definitionName] : null;

    }


    //////////////////////////////////

    /**
     * Input a definition name or basic type and receive the most basic _type of that definition
     * @alias fluro.types.parentType
     * @param  {String} definitionName The definition or _type
     * @return {String}  Eg. 'photo', 'service', or 'song'...
     */
    service.parentType = function(definitionName) {

        var match = service.glossary ? service.glossary[definitionName] : null;

        if (match) {
            definitionName = match.parentType || definitionName;
        }

        return definitionName;
    }

    

    //////////////////////////////////

    /**
     * Retrieve an array of all basic types
     * @alias fluro.types.basicTypes
     * @return {Array}  eg. 'service', 'concert', 'conference'
     */
    service.basicTypes = function() {
        var values = _.map(basicTypes, function(typeName) {
            return service.glossary[typeName];
        })

        return Promise.resolve(values);
    }

    //////////////////////////////////

    /**
     * Input a definition name or basic type and receive the most basic _type of that definition
     * @alias fluro.types.subTypes
     * @param  {String} definitionName The basic _type
     * @param  {Boolean} includeBasicType Whether to include the basic type definition in the results
     * @return {Array}  eg. 'service', 'concert', 'conference'
     */
    service.subTypes = function(typeName, includeBasicType) {


        var definitions = _.chain(service.glossary)
        .reduce(function(set, term, key) {

        	if(term.status == 'archived') {
        		return set;
        	}

            term.definitionName = key;
            if (term.parentType == typeName) {
                set.push(term);
            }

            return set;
        }, [])
        .orderBy(function(definition) {
            return definition.title;
        })
        .value();

        ///////////////////////////////////////

        if(includeBasicType) {
            var basicTypeMatch = service.glossary[typeName];
            if(basicTypeMatch) {
                definitions.unshift(basicTypeMatch)
            }
        }

        ///////////////////////////////////////

        return Promise.resolve(definitions);

        // var match = service.glossary ? service.glossary[definitionName] : null;

        // if (match) {
        //     definitionName = match.parentType || definitionName;
        // }

        // return definitionName;
    }


    //////////////////////////////////

    /**
     * Input a definition name or basic type and receive the most basic _type of that definition
     * @alias fluro.types.postableTypes
     * @param  {String} definitionName The definition or _type
     * @param  {Object} options Extra options
     * @return {Array} an array of definitions that can be posted
     *
    /**
    service.postableTypes = function(typeName, options) {

        if(!options) {
            options = {
                list: true,
                strict: true,
            }
        }


        return new Promise(function(resolve, reject) {

            FluroCore.api.post('/defined', options)
                .then(function(res) {

                    // console.log('GOT ALL THE TYPES', res.data);
                    resolve(res.data);
                }, reject);

        });



        // FluroContent.endpoint('post/types/' + type, true, true)
        //     .query(options)
        //     .$promise.then(function(res) {
        //         var filtered = _.filter(res, function(definition) {
        //             var definitionName = definition.definitionName;
        //             var canView = FluroAccess.can('view', definitionName, 'post');
        //             var canCreate = FluroAccess.can('create', definitionName, 'post');
        //             var canSubmit = FluroAccess.can('submit', definitionName, 'post');

        //             // console.log('CAN?', $rootScope.user, type, canCreate, canSubmit);

        //             return (canCreate || canSubmit);
        //         });

        //         return deferred.resolve(filtered);

        //     }, deferred.reject);

        // var match = service.glossary ? service.glossary[definitionName] : null;

        // if (match) {
        //     definitionName = match.parentType || definitionName;
        // }
         
        // return definitionName;
    }
    /**/

    //////////////////////////////////

    /**
     * Input a definition name or basic type and receive the most basic _type of that definition
     * @alias fluro.types.postableTypes
     * @param  {String} definitionName The definition or _type
     * @param  {Object} options Extra options
     * @return {Array} an array of definitions that can be posted
     *
     */
    service.processTypes = function(typeName, options) {

        if (!options) {
            options = {
                list: true,
                strict: false,
            }
        }

        return new Promise(function(resolve, reject) {

            console.log('GET THE PROCESS TYPES')
            // return resolve([]);
            
            FluroCore.api.get(`/process/types/${typeName}`, {
                    params: options
                })
                .then(function(res) {


                    // var filtered = _.filter(res, function(definition) {
                    //     var definitionName = definition.definitionName;
                    //     var canView = FluroAccess.can('view', definitionName, 'process');
                    //     var canCreate = FluroAccess.can('create', definitionName, 'process');
                    //     return (canView || canCreate);
                    // });

                    // console.log('GOT ALL THE TYPES', res.data);
                    resolve(res.data);
                }, reject);

        });
    }


    //////////////////////////////////

    // /**
    //  * Input definition names or basic types and receive a list of all
    //  * posts that can be attached to that type of content
    //  * @alias fluro.types.postTypes
    //  * @param  {Array} definitionNames The definitions or _types to check
    //  * @param  {Object} options Extra options
    //  * @return {Array} an array of definitions that can be posted
    //  *
    //  */
    // service.postTypes = function(typeName, options) {

    //     if (!options) {
    //         options = {
    //             list: true,
    //             strict: true,
    //         }
    //     }

    //     return new Promise(function(resolve, reject) {

    //         FluroCore.api.get(`/post/types/${typeName}`, {
    //                 params: options
    //             })
    //             .then(function(res) {
    //                 resolve(res.data);
    //             }, reject);

    //     });
    // }

    //////////////////////////////////

    /**
     * Retrieves a list of specified types and their respective definitions
     * @alias fluro.types.retrieve
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

                    // console.log('GOT ALL THE TYPES', res.data);
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