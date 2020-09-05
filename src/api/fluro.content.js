import _ from 'lodash';
import axios from 'axios';
const CancelToken = axios.CancelToken;
import FluroContentListService from '../services/FluroContentListService';

import {
    Cache,
} from 'axios-extensions';

///////////////////////////////////////////////////


/**
 * Creates a new FluroContent instance.
 * This module provides a number of helper functions for Creating, Reading, Updating and Deleting content via the Fluro API
 * @alias content
 * @constructor
 * @hideconstructor
 * @param {FluroCore} fluro A reference to the parent instance of the FluroCore module. This module is usually created by a FluroCore instance that passes itself in as the first argument.
 */
var FluroContent = function(fluro) {

    if (!fluro.api) {
        throw new Error(`Can't Instantiate FluroContent before FluroAPI exists`);
    }

    //Keep track of any refresh requests
    var inflightRefreshRequest;

    ///////////////////////////////////////////////////

    var service = {}

    ///////////////////////////////////////////////////


    /**
     * Runs a search from the Fluro server and returns the results
     * @alias content.search
     * @param  {String} terms   The keywords to search for
     * @param  {Object} options Extra Configuration and options for how to search the database and how to render the results
     * @param  {Object} options.limit How many results should be returned. Defaults to 10
     * @param  {Array} options.types Specify types or definition names for which items should be searched for
     * @param  {Boolean} options.showQuery If true will return the query used to search instead of the search results themselves
     * @return {Array}         An array of content items that match the search, if options.types is specified will be a nested array of results for each type
     *
     * @example
     * fluro.content.search('Wonder', {limit:5, types:['song', 'album', 'tag']}).then(function(results) {
     *  //Will return a nested array with up to 5 results for each type
     *  //[{_type:'Song', results:[{title:"Wonder"...}]}, {_type:'Album', results:[{title:"Wonder"...}]}]
     * })
     *
     * fluro.content.search('Wonder', {limit:5}).then(function(results) {
     *  //Will return an array of up to 5 items the user has access to view that match the search terms
     *  //[{title:"Wonder", _type:'article', definition:'song'...}, {title:"Wonder", _type:'article', definition:'album'...}]
     * })
     */


    /////////////////////////////////////////////////

    var currentSearch;

    /////////////////////////////////////////////////

    service.search = function(terms, params, config) {

        if (!params) {
            params = {};
        }

        if (!params.limit) {
            params.limit = 10;
        }

        /////////////////////////////////////////////////

        if (currentSearch) {
            // cancel the request (the message parameter is optional)
            currentSearch.cancel('Operation canceled by the user.');
        }


        /////////////////////////////////////////////////

        currentSearch = CancelToken.source();

        /////////////////////////////////////////////////

        return new Promise(function(resolve, reject) {

            if (!terms || !terms.length) {
                return resolve([]);
            }

            if (!config) {
                config = {};
            }

            config.params = params;
            config.cancelToken = currentSearch.token;
            // var requestOptions = {
            //     params: options,
            //     cancelToken: currentSearch.token,
            // }

            /////////////////////////////////////////////

            //Retrieve the query results
            fluro.api.get(`/content/search/${terms}`, config).then(function(res) {
                resolve(res.data);

            }).catch(function(thrown) {
                if (axios.isCancel(thrown)) {
                    // console.log('Request canceled', thrown.message);
                } else {
                    // handle error
                }
            });

        });

    }

    ///////////////////////////////////////////////////


    /**
     * Retrieves a specific definition or data type
     * @alias content.type
     * @param  {String} definitionName   The defined type or definition name to retrieve
     * @param  {Object} options Extra Configuration and options for how to search the database and how to render the results
     * @return {Promise}         A promise that will resolve with the definition
     *
     * @example
     * fluro.content.type('song', options, config).then(function(definition) {
     *  //Will return the definition
     * })
     */

    var typePromise;
    var typeCacheable = true;

    /////////////////////////////////////////////////

    service.type = function(definitionName, params) {

        if (!params) {
            params = {};
        }

        if (!definitionName) {
            throw Error('No definition name was provided');
        }

        /////////////////////////////////////////////////

        //If we are already requesting this definition
        if (!typePromise || !typeCacheable) {

            //Create a new promise
            typePromise = new Promise(function(resolve, reject) {

                // if (!config) {
                //     config = {};
                // }

                // config.params = params;
                // var requestOptions = {
                //     params: options,
                //     cancelToken: currentMentionSearch.token,
                // }

                /////////////////////////////////////////////

                //Retrieve the definition from the server and send it back to
                //the user
                fluro.api.get(`/defined/${definitionName}`)
                    .then(function(res) {
                        resolve(res.data);
                        typeCacheable = true;
                    }).catch(function(err) {
                        reject(err);
                        typeCacheable = false;
                    });

            });
        }

        /////////////////////////////////////////////////

        return typePromise;

    }


    ///////////////////////////////////////////////////


    /**
     * Runs a search from the Fluro server for a specific mentionable user
     * @alias content.mention
     * @param  {String} mentionID   the Name or Mention ID of the persona to search for
     * @param  {Object} options Extra Configuration and options for how to search the database and how to render the results
     * @param  {Object} config Optional HTTP Request Configuration
     * @param  {Integer} options.limit Extra Configuration and options for how to search the database and how to render the results
     * @param  {Integer} options.managed Search for managed personas instead of Global Fluro user personas
     * @return {Array}         An array of personas who can be mentioned
     *
     * @example
     * fluro.content.mention('john.smith', {limit:5}, config).then(function(results) {
     *  //Will return a nested array with up to 5 personas
     * })
     */


    /////////////////////////////////////////////////

    var currentMentionSearch;

    /////////////////////////////////////////////////

    service.mention = function(terms, params, config) {

        if (!params) {
            params = {};
        }

        if (!params.limit) {
            params.limit = 5;
        }

        /////////////////////////////////////////////////

        if (currentMentionSearch) {
            // cancel the request (the message parameter is optional)
            currentMentionSearch.cancel('Operation canceled by the user.');
        }


        /////////////////////////////////////////////////

        currentMentionSearch = CancelToken.source();

        /////////////////////////////////////////////////

        return new Promise(function(resolve, reject) {

            if (!terms || !terms.length) {
                return resolve([]);
            }

            if (!config) {
                config = {};
            }

            config.params = params;
            config.cancelToken = currentMentionSearch.token;
            // var requestOptions = {
            //     params: options,
            //     cancelToken: currentMentionSearch.token,
            // }

            /////////////////////////////////////////////

            //Retrieve the query results
            fluro.api.get(`/mention/${terms}`, config).then(function(res) {
                resolve(res.data);

            }).catch(function(thrown) {
                if (axios.isCancel(thrown)) {
                    // console.log('Request canceled', thrown.message);
                } else {
                    // handle error
                }
            });

        });

    }

    ///////////////////////////////////////////////////

    /**
     * A helper function for retrieving the results of a specified query
     * @alias content.query
     * @param  {String} queryID The id of the query you want to run
     * @param  {Object} options The options for the query
     * @param  {Object} options.params The query string parameters for the query that will be mapped ?one=value&two=value
     * @param  {Object} options.variables Any query variables you wish to inject each key will be mapped ?variables[key]=value
     * @return {Promise}         A promise that will be resolved with the results or an error
     */
    service.query = function(queryID, options, requestOptions) {

        //Get as just a query
        queryID = fluro.utils.getStringID(queryID);

        if (!options) {
            options = {}
        }

        if (!requestOptions) {
            requestOptions = {
                params: {},
            }
        }


        return new Promise(function(resolve, reject) {

            //If there are query string parameters
            if (options.params) {
                requestOptions.params = options.params;
            }

            /////////////////////////////////////////////

            if (options.variables) {
                var variableParams = _.reduce(options.variables, function(set, value, key) {
                    set[`variables[${key}]`] = value;

                    return set;
                }, {})

                //Add it to our parameters
                _.assign(requestOptions.params, variableParams);
            }

            /////////////////////////////////////////////

            //Retrieve the query results
            fluro.api.get(`/content/_query/${queryID}`, requestOptions).then(function(res) {

                resolve(res.data);

            }, reject);

        })
    }

    ///////////////////////////////////////////////////

    /**
     * This function returns a single populated item by providing its _id
     * @alias content.get
     * @param  {String} id The item's _id
     * @param  {Object} params Extra query string parameters for the request
     * @return {Promise}         A promise that will be resolved with the item or an error
     * @example
     *
     * //Retrieve just the title for item '5be504eabf33991239599d63'
     * fluro.content.get('5be504eabf33991239599d63', {select:'title'})
     */
    service.get = function(id, params, requestOptions) {

        if (!requestOptions) {
            requestOptions = {};
        }

        /////////////////////////////////////

        //Ensure it's a simple single ID
        id = fluro.utils.getStringID(id);

        /////////////////////////////////////

        if (!params) {
            params = {}
        }

        /////////////////////////////////////

        return new Promise(function(resolve, reject) {

            //If there are query string parameters
            if (params) {
                requestOptions.params = params;
            }

            /////////////////////////////////////////////

            // console.log('REQUEST OPTIONS', requestOptions);

            //Retrieve the query results
            fluro.api.get(`/content/get/${id}`, requestOptions)
                .then(function(res) {
                    resolve(res.data);
                }, reject);

        })
    }




    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////

    /**
     * This function returns a single populated item by providing its _external id
     * @alias content.external
     * @param  {String} externalID The item's _external id property
     * @param  {Object} params Extra query string parameters for the request
     * @return {Promise}         A promise that will be resolved with the item or an error
     * @example
     *
     * //Retrieve just the title for item with external id that matches '5be504-eabf33991-239599-d63'
     * fluro.content.external('5be504-eabf33991-239599-d63', {select:'title'})
     */
    service.external = function(id, params, requestOptions) {

        if (!requestOptions) {
            requestOptions = {};
        }

        /////////////////////////////////////

        if (!params) {
            params = {}
        }

        return new Promise(function(resolve, reject) {

            //If there are query string parameters
            if (params) {
                requestOptions.params = params;
            }


            /////////////////////////////////////////////

            //Retrieve the query results
            fluro.api.get(`/content/external/${id}`, requestOptions).then(function(res) {
                resolve(res.data);
            }, reject);

        })
    }

    ///////////////////////////////////////////////////

    /**
     * This function returns a single populated item by providing its slug
     * @alias content.slug
     * @param  {String} slug The item's slug value
     * @param  {Object} params Extra query string parameters for the request
     * @return {Promise}         A promise that will be resolved with the item or an error
     * @example
     *
     * //Retrieve just the title for item with the slug 'my-article'
     * fluro.content.slug('my-article', {select:'title'})
     */
    service.slug = function(id, params, requestOptions) {

        if (!requestOptions) {
            requestOptions = {}
        }

        if (!params) {
            params = {}
        }



        return new Promise(function(resolve, reject) {


            //If there are query string parameters
            if (params) {
                requestOptions.params = params;
            }

            /////////////////////////////////////////////


            //Retrieve the query results
            fluro.api.get(`/content/slug/${id}`, requestOptions).then(function(res) {
                resolve(res.data);
            }, reject);

        })
    }

    ///////////////////////////////////////////////////

    /**
     * A helper function for retrieving the results of a dynamic query
     * @alias content.retrieve
     * @param  {Object} criteria The query criteria
     * @param  {Object} options Extra options and parameters
     * @return {Promise}         A promise that will be resolved with the results or an error
     * @example
     *
     * //Find all events that have a status of active or archived where the endDate is greater than or equal to now and return the titles
     * fluro.content.retrieve({_type:'event', status:{$in:['active', 'archived']}, endDate:{$gte:"date('now')"}}}, {select:'title'})
     */
    service.retrieve = function(criteria, params, requestOptions) {

        if (!params) {
            params = {}
        }

        if (!requestOptions) {
            requestOptions = {}
        }


        return new Promise(function(resolve, reject) {


            //If there are query string parameters
            if (params) {
                requestOptions.params = params;
            }

            /////////////////////////////////////////////

            //Retrieve the query results
            fluro.api.post(`/content/_query`, criteria, requestOptions).then(function(res) {

                resolve(res.data);

            }, reject);

        })
    }


    ///////////////////////////////////////////////////

    /**
     * This function returns a list of related items
     * That either reference the specified item or are referenced by the provided item
     * @alias content.related
     * @param  {String} id The item to find related content for
     * @param  {Object} params Extra query string parameters for the request
     * @return {Promise}         A promise that will be resolved with an array of related items
     * @example
     *
     * //Retrieve some related items for '5be504eabf33991239599d63'
     * fluro.content.related('5be504eabf33991239599d63', {select:'title'})
     */
    service.related = function(id, params, requestOptions) {




        id = fluro.utils.getStringID(id);

        if (!id) {
            throw Error(`No id specified ${id}`);
        }


        if (!requestOptions) {
            requestOptions = {}
        }

        if (!params) {
            params = {}
        }

        return new Promise(function(resolve, reject) {

            //If there are query string parameters
            if (params) {
                requestOptions.params = params;
            }

            var criteria = {
                _references: id,
            }

            // service.retrieve(criteria, requestOptions).then(resolve, reject);


            // /////////////////////////////////////////////

            //Retrieve the query results
            fluro.api.get(`/content/related/${id}`, requestOptions).then(function(res) {
                resolve(res.data);
            }, reject);

        })
    }



    ///////////////////////////////////////////////////

    /**
     * This function returns an interaction definition via the public 'form' API endpoint
     * This will only result successfully if the definition requested has the definition of 'form' and has the status of 'active'
     * @alias content.form
     * @param  {String} id The id of the form to retrieve
     * @param  {Object} options Extra options for the request
     * @param  {Object} options.testing Whether to load the form in testing mode or not
     * @return {Promise}         A promise that will be resolved with the form or an error
     * @example
     *
     * //Retrieve a form ('58dca23c21428d2d045a1cf7') in testing mode
     * fluro.content.form('58dca23c21428d2d045a1cf7', {testing:true})
     */
    service.form = function(id, options, requestOptions) {
        id = fluro.utils.getStringID(id);

        if (!id) {
            throw Error(`No id specified ${id}`);
        }

        if (!requestOptions) {
            requestOptions = {}
        }

        if (!options) {
            options = {}
        }

        if (options.requestOptions) {
            requestOptions = options.requestOptions;
        }

        return new Promise(function(resolve, reject) {


            //If there are query string parameters
            // if (params) {
            //     requestOptions.params = params;
            // }

            // service.retrieve(criteria, requestOptions).then(resolve, reject);


            // /////////////////////////////////////////////

            // console.log('request form', id, requestOptions);
            //Retrieve the query results
            fluro.api.get(`/form/${id}`, requestOptions).then(function(res) {
                // console.log('resolve form', res.data);
                resolve(res.data);
            }, reject);

        })
    }


    ///////////////////////////////////////////////////

    /**
     * This function makes it easy to submit form interactions via the Fluro API
     * @alias content.submitInteraction
     * @param  {String} definitionName the definition of the form you want to submit eg. 'supportRequest' or 'contactUs'... 
     * @param  {Object} data The interaction data to submit
     * @param  {Object} options Extra options for the request
     * @param  {Object} options.reply The id of the post to reply to (If threaded conversation)
     * @return {Promise}         A promise that will be resolved with an array of related items
     * @example
     *
     * //Retrieve some related items for '5be504eabf33991239599d63'
     * fluro.content.submitInteraction('5be504eabf33991239599d63', 'comment', {data:{customField:'My message'}}, {reply:'5be504eabf33991239599d63'})
     */
    service.submitInteraction = function(type, submission, options) {

        console.log('SUBMIT INTERACTION')
        if (!options) {
            options = {}
        }

        return new Promise(function(resolve, reject) {

            var requestOptions = options;




            /////////////////////////////////////////////

            console.log('SUBMISSION ACTIONS', requestOptions);

            //Retrieve the query results
            fluro.api.post(`/interact/${type}`, submission, requestOptions)
                .then(function(res) {
                    resolve(res.data);
                }, reject);

        })
    }

    ///////////////////////////////////////////////////

    /**
     * This function makes it easy to create and attach a post to a specified piece of fluro content 
     * @alias content.submitPost
     * @param  {String} target The ID of the item to attach this post to
     * @param  {String} definitionName the definition type of the post you want to create eg. 'note' or 'comment'... 
     * @param  {Object} data The post content to create
     * @param  {Object} options Extra options for the request
     * @param  {Object} options.reply The id of the post to reply to (If threaded conversation)
     * @return {Promise}         A promise that will be resolved with an array of related items
     * @example
     *
     * //Retrieve some related items for '5be504eabf33991239599d63'
     * fluro.content.submitPost('5be504eabf33991239599d63', 'comment', {data:{customField:'My message'}}, {reply:'5be504eabf33991239599d63'})
     */
    service.submitPost = function(id, type, body, options) {


        id = fluro.utils.getStringID(id);

        if (!id) {
            throw Error(`No target specified ${id}`);
        }

        if (!options) {
            options = {}
        }

        return new Promise(function(resolve, reject) {

            var requestOptions = {
                // params: {}
            }

            // /////////////////////////////////////////////

            //Retrieve the query results
            fluro.api.post(`/post/${id}/${type}`, body, requestOptions)
                .then(function(res) {
                    resolve(res.data);
                }, reject);

        })
    }

    ///////////////////////////////////////////////////

    /**
     * This function makes it easy to retrieve the current thread of posts attached to a specific
     * item
     * @alias content.thread
     * @param  {String} target The ID of the item to attach this post to
     * @param  {String} definitionName the definition type of the post you want to create eg. 'note' or 'comment'... 
     * @param  {Object} data The post content to create
     * @param  {Object} options Extra options for the request
     * @param  {Object} options.reply The id of the post to reply to (If threaded conversation)
     * @return {Promise}         A promise that will be resolved with an array of related items
     * @example
     *
     * //Retrieve the current post thread of all 'comments' attached to a specific content
     * fluro.content.thread('5be504eabf33991239599d63', 'comment', {data:{customField:'My message'}}, {reply:'5be504eabf33991239599d63'})
     */
    service.thread = function(id, type, options) {


        id = fluro.utils.getStringID(id);

        if (!id) {
            throw Error(`No target specified ${id}`);
        }

        if (!options) {
            options = {}
        }

        return new Promise(function(resolve, reject) {

            var requestOptions = {
                // params: {}
            }

            // /////////////////////////////////////////////

            //Retrieve the query results
            fluro.api.get(`/post/${id}/${type}`, requestOptions)
                .then(function(res) {
                    resolve(res.data);
                }, reject);

        })
    }


    ///////////////////////////////////////////////////

    /**
     * This function makes it easy to retrieve all distinct values for a specified field key
     * for a specified subset of items from the server, for instance if you wanted to retrieve all possible 'firstName' values from
     * a selection of content ids
     * @alias content.values
     * @param  {Array} ids The ids you want to retrieve values for
     * @param  {String} key the key of the field you want to retrieve the values for
     * @return {Promise}         A promise that will be resolved with an array of possible values
     * @example
     *
     * 
     * fluro.content.values(['5be504eabf33991239599d63'], 'firstName').then(function(values) {
     *       //Would return ['Frank', 'Lucy', 'Marissa']
     * })
     */
    service.values = function(ids, key, options) {


        ids = fluro.utils.arrayIDs(ids);

        // if (!ids | !ids.length ) {
        //     throw Error(`No ids specified ${ids}`);
        // }

        if (!key | !key.length) {
            throw Error(`No key specified `);
        }

        if (!options) {
            options = {}
        }

        return new Promise(function(resolve, reject) {

            var payload = {
                ids,
                key,
            }

            /////////////////////////////////////////////

            var url = `/content/distinct/values`;

            if (options.type) {
                url = `/content/${options.type}/distinct/values`;
            }

            /////////////////////////////////////////////
            //Retrieve the query results
            return fluro.api.post(url, payload, options)
                .then(function(res) {
                    resolve(_.orderBy(res.data, function(entry) {
                        return entry.title || entry;
                    }));
                }, reject);

        })
    }


    service.createDuplicate = function(populatedItem) {

        var definedType = populatedItem.definition || populatedItem._type;
        var newItem = JSON.parse(JSON.stringify(populatedItem));
        ////////////////////////////////////////////

        delete newItem._id;
        delete newItem.slug;
        delete newItem.author;
        delete newItem.managedAuthor;
        delete newItem.__v;
        delete newItem.created;
        delete newItem.updated;
        delete newItem.updatedBy;
        delete newItem.stats;
        delete newItem.privateDetails;
        delete newItem._external;
        delete newItem.apikey;

        ////////////////////////////////////////////

        switch (newItem._type) {
            case 'event':
                //Clear out other bits
                newItem.plans = [];
                newItem.assignments = [];
                break;
            case 'mailout':
                newItem.state = 'ready';
                newItem.subject = newItem.title;
                newItem.title = newItem.title + ' Copy';
                delete newItem.publishDate;
                break;
            case 'plan':
                newItem.startDate = null;
                break;
            case 'persona':
                newItem.user = null;
                newItem.collectionEmail = '';
                newItem.username = '';
                newItem.firstName = '';
                newItem.lastName = '';
                break;
        }


        newItem.status = 'active';

        ////////////////////////////////////////////

        newItem.realms = [];
        delete newItem.account;

        return Promise.resolve(newItem);
    }

    ///////////////////////////////////////////////////

    /**
     * This function combines the fluro.content.filter() and the fluro.content.getMultiple so you can easily
     * retrieve a fully populated list of content items
     * @alias content.list
     * @param  {String} typeName The type or definition name of the content you want to retrieve
     * @param  {Object} options Extra options for creating the service
     * @param  {Object} options.criteria The filter criteria for specifying which content items should be returned
     * @param  {Object} options.perPage The number of items to retrieve per page
     * @param  {Object} options.pageIndex The starting page to load from the list
     * @param  {Object} options.cacheKey A cache id that can be used to refresh cached results
     * @return {Object}         A new instance of a FluroContentListService
     * @example
     *
     * //How to sort the results
     * var sort = {
     *     key:'title',
     *     direction:'asc',
     *     type:'string',
     * }
     *
     * //If you want to filter by search keywords
     * var search = 'Any keywords you want to search for'
     *
     * //If you want to crop results to within a certain timeframe
     * var startDate;// = new Date();
     * var endDate;// = new Date()
     *     
     * //For more complex AND/OR filtering
     * var filter = {
     *     operator:'and',
     *     filters:[
     *        {
     *           key:'status',
     *           comparator:'in',
     *           values:['active'],
     *        }
     *     ]
     * }
     *
     * var criteria = {
     *   search,
     *   sort,
     *   startDate,
     *   endDate,
     *   filter,
     * }
     *
     * fluro.content.list('event', {
     *     perPage: 2,
     *     criteria,
     * }).then(function(results) { })
     */

    service.list = function(typeName, options) {
        return  new FluroContentListService(typeName, fluro, options);
    }

    ///////////////////////////////////////////////////

    /**
     * This function makes it easy to retrieve a large filtered list of content matching certain criteria
     * Only the relevant fields will be returned that allows you to paginate and populate content with the 
     * fluro.content.getMultiple() function
     * @alias content.filter
     * @param  {String} typeName The type or definition name of the content you want to retrieve
     * @param  {Object} criteria The criteria used to filter the results
     * @return {Promise}         A promise that will be resolved with an array of all results
     * @example
     *
     * //How to sort the results
     * var sort = {
     *     key:'title',
     *     direction:'asc',
     *     type:'string',
     * }
     *
     * //If you want to filter by search keywords
     * var search = 'Any keywords you want to search for'
     *
     * //If you want to crop results to within a certain timeframe
     * var startDate;// = new Date();
     * var endDate;// = new Date()
     *     
     * //For more complex AND/OR filtering
     * var filter = {
     *     operator:'and',
     *     filters:[
     *        {
     *           key:'status',
     *           comparator:'in',
     *           values:['active'],
     *        }
     *     ]
     * }
     *
     * var criteria = {
     *   search,
     *   sort,
     *   startDate,
     *   endDate,
     *   filter,
     * }
     *
     * fluro.content.filter('event', criteria)
     * .then(function(results) {
     *       //Returns all results with the basic fields
     * })
     */

    service.filter = function(typeName, criteria) {

        return new Promise(function(resolve, reject) {
            return fluro.api.post(`/content/${typeName}/filter`, criteria)
                .then(function(res) {
                    return resolve(res.data);
                })
                .catch(reject);
        })
    }


    ///////////////////////////////////////////////////

    /**
     * This function makes it easy to retrieve the full content items for a specified selection of ids
     * @alias content.getMultiple
     * @param  {String} typeName The type or definition name of the content you want to retrieve
     * @param  {Array} ids The ids of the content you want to retrieve
     * @param  {Object} options extra options for the request
     * @param  {Array} options.select specify fields you want to retrieve for the items. If blank will return the full object
     * @return {Promise}         A promise that will be resolved with an array of possible keys
     * @example
     *
     * 
     * fluro.content.getMultiple(['5be504eabf33991239599d63', '5be504eabf33721239599d83'])
     .then(function(items) {
     *       //Returns the full content items
     * })
     */
    service.getMultiple = function(typeName, ids, options) {

        //Ensure the ids are actually ids
        ids = fluro.utils.arrayIDs(ids);

        return new Promise(function(resolve, reject) {

            fluro.api.post(`/content/${typeName}/multiple`, {
                    ids,
                    select: options.select ? _.uniq(options.select) : undefined,
                    //populateAll: true,
                    limit: ids.length,
                    //appendContactDetails,
                    //appendAssignments,
                    //appendFullFamily,

                    // cancelToken: currentPageItemsRequest.token,
                })
                .then(function(res) {
                    resolve(res.data);
                })
                .catch(reject);
        })
    }

    ///////////////////////////////////////////////////

    /**
     * This function makes it easy to retrieve all distinct keys for a specified selection of ids
     * @alias content.keys
     * @param  {Array} ids The ids you want to retrieve keys for
     * @param  {Object} options extra options and query parameters for the http request
     * @return {Promise}         A promise that will be resolved with an array of possible keys
     * @example
     *
     * 
     * fluro.content.keys(['5be504eabf33991239599d63']).then(function(values) {
     *       //Would return ['firstName', 'lastName', 'title', 'tags', 'realms']
     * })
     */
    service.keys = function(ids, options) {


        ids = fluro.utils.arrayIDs(ids);

        if (!ids | !ids.length) {
            throw Error(`No ids specified ${ids}`);
        }

        if (!options) {
            options = {}
        }

        return new Promise(function(resolve, reject) {

            var payload = {
                ids,
            }

            /////////////////////////////////////////////

            var url = `/content/distinct/keys`;

            if (options.type) {
                url = `/content/${options.type}/distinct/keys`;
            }

            /////////////////////////////////////////////

            //Retrieve the query results
            return fluro.api.post(url, payload, options)
                .then(function(res) {
                    resolve(res.data);
                }, reject);

        })
    }


    ///////////////////////////////////////////////////

    /**
     * This function creates a clean copy of a specified content item
     * @alias content.duplicate
     * @param  {Object} item The ID or object representing the item you want to duplicate
     * @return {Promise}         A promise that will be resolved with a cleaned duplicate of the original item
     * @example
     *
     * 
     * fluro.content.duplicate({_id:'5be504eabf33991239599d63'})
     * .then(function(freshItem) {
     *       //Fresh item is a cleaned duplicate of the original item
     * })
     */
    service.duplicate = function(item, options) {

        if (!options) {
            options = {};
        }

        ///////////////////////////////////////

        var itemID = fluro.utils.getStringID(item);

        return new Promise(function(resolve, reject) {

            //Load the proper thing
            service.get(itemID)
                .then(function(populatedItem) {

                    var definedType = populatedItem.definition || populatedItem._type;
                    var newItem = JSON.parse(JSON.stringify(populatedItem));
                    ////////////////////////////////////////////

                    //Remove the bits and pieces
                    delete newItem._id;
                    delete newItem.slug;
                    delete newItem.author;
                    delete newItem.managedAuthor;
                    delete newItem.__v;
                    delete newItem.created;
                    delete newItem.updated;
                    delete newItem.updatedBy;
                    delete newItem.stats;
                    delete newItem.privateDetails;
                    delete newItem._external;
                    delete newItem.apikey;


                    ////////////////////////////////////////////

                    if (options.customise) {
                        //Keep the definition name
                    } else {
                        delete newItem.definitionName;
                        console.log('Dupliacate', newItem)
                    }


                    ////////////////////////////////////////////

                    switch (newItem._type) {
                        case 'event':
                            //Clear out other bits
                            newItem.plans = [];
                            newItem.assignments = [];
                            break;
                        case 'mailout':
                            newItem.state = 'ready';
                            newItem.subject = newItem.title;
                            newItem.title = newItem.title + ' Copy';
                            delete newItem.publishDate;
                            break;
                        case 'plan':
                            newItem.startDate = null;
                            break;
                        case 'persona':
                            newItem.user = null;
                            newItem.collectionEmail = '';
                            newItem.username = '';
                            newItem.firstName = '';
                            newItem.lastName = '';
                            break;
                    }

                    //Set the new item as active
                    newItem.status = 'active';

                    ////////////////////////////////////////////

                    var accountID = fluro.utils.getStringID(newItem.account);
                    var userAccountID = fluro.utils.getStringID(populatedItem.account);

                    if (userAccountID != accountID) {
                        newItem.realms = [];
                    }

                    delete newItem.account;

                    ////////////////////////////////////////////

                    return resolve(newItem);
                })
                .catch(reject)
        })
    }

    //////////////////////////////////////

    return service;

}

export default FluroContent;