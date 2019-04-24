import _ from 'lodash';

///////////////////////////////////////////////////


/**
 * Creates a new FluroContent instance.
 * This module provides a number of helper functions for Creating, Reading, Updating and Deleting content via the Fluro API
 * 
 * @constructor
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
      * @alias FluroContent.search
      * @param  {String} terms   The keywords to search for
      * @param  {Object} options Extra Configuration and options for how to search the database and how to render the results
      * @param  {Object} options.limit How many results should be returned. Defaults to 10
      * @param  {Array} options.types Specify types or definition names for which items should be searched for
      * @param  {Boolean} options.showQuery If true will return the query used to search instead of the search results themselves
      * @return {Array}         An array of content items that match the search, if options.types is specified will be a nested array of results for each type
      *
      * @example
      * FluroContent.search('Wonder', {limit:5, types:['song', 'album', 'tag']}).then(function(results) {
      *  //Will return a nested array with up to 5 results for each type
      *  //[{_type:'Song', results:[{title:"Wonder"...}]}, {_type:'Album', results:[{title:"Wonder"...}]}]
      * })
      *
      * FluroContent.search('Wonder', {limit:5}).then(function(results) {
      *  //Will return an array of up to 5 items the user has access to view that match the search terms
      *  //[{title:"Wonder", _type:'article', definition:'song'...}, {title:"Wonder", _type:'article', definition:'album'...}]
      * })
      */
    service.search = function(terms, options) {


        if (!options) {
            options = {};
        }

        if (!options.limit) {
            options.limit = 10;
        }

        return new Promise(function(resolve, reject) {

            if (!terms || !terms.length) {
                return resolve([]);
            }
        
            var requestOptions = {
                params: options,
            }

            /////////////////////////////////////////////

            //Retrieve the query results
            fluro.api.get(`/content/search/${terms}`, requestOptions).then(function(res) {
                resolve(res.data);

            }, reject);

        });

    }

    ///////////////////////////////////////////////////

    /**
     * A helper function for retrieving the results of a specified query
     * @alias FluroContent.query
     * @param  {String} queryID The id of the query you want to run
     * @param  {Object} options The options for the query
     * @param  {Object} options.params The query string parameters for the query that will be mapped ?one=value&two=value
     * @param  {Object} options.variables Any query variables you wish to inject each key will be mapped ?variables[key]=value
     * @return {Promise}         A promise that will be resolved with the results or an error
     */
    service.query = function(queryID, options) {

        //Get as just a query
        queryID = fluro.utils.getStringID(queryID);

        if (!options) {
            options = {}
        }

        return new Promise(function(resolve, reject) {


            var requestOptions = {
                params: {}
            }

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
     * @alias FluroContent.get
     * @param  {String} id The item's _id
     * @param  {Object} params Extra query string parameters for the request
     * @return {Promise}         A promise that will be resolved with the item or an error
     * @example
     *
     * //Retrieve just the title for item '5be504eabf33991239599d63'
     * FluroContent.get('5be504eabf33991239599d63', {select:'title'})
     */
    service.get = function(id, params) {

        if (!params) {
            params = {}
        }

        return new Promise(function(resolve, reject) {


            var requestOptions = {
                params: {}
            }

            //If there are query string parameters
            if (params) {
                requestOptions.params = params;
            }

            /////////////////////////////////////////////

            //Retrieve the query results
            fluro.api.get(`/content/get/${id}`, requestOptions).then(function(res) {
                resolve(res.data);
            }, reject);

        })
    }

    ///////////////////////////////////////////////////

    /**
     * This function returns a single populated item by providing its _external id
     * @alias FluroContent.external
     * @param  {String} externalID The item's _external id property
     * @param  {Object} params Extra query string parameters for the request
     * @return {Promise}         A promise that will be resolved with the item or an error
     * @example
     *
     * //Retrieve just the title for item with external id that matches '5be504-eabf33991-239599-d63'
     * FluroContent.external('5be504-eabf33991-239599-d63', {select:'title'})
     */
    service.external = function(id, params) {

        if (!params) {
            params = {}
        }

        return new Promise(function(resolve, reject) {


            var requestOptions = {
                params: {}
            }

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
     * @alias FluroContent.slug
     * @param  {String} slug The item's slug value
     * @param  {Object} params Extra query string parameters for the request
     * @return {Promise}         A promise that will be resolved with the item or an error
     * @example
     *
     * //Retrieve just the title for item with the slug 'my-article'
     * FluroContent.slug('my-article', {select:'title'})
     */
    service.slug = function(id, params) {

        if (!params) {
            params = {}
        }

        return new Promise(function(resolve, reject) {


            var requestOptions = {
                params: {}
            }

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
     * A helper function for retrieving the results of a dynamic query
     * @alias FluroContent.retrieve
     * @param  {Object} criteria The query criteria
     * @param  {Object} options Extra options and parameters
     * @return {Promise}         A promise that will be resolved with the results or an error
     * @example
     *
     * //Find all events that have a status of active or archived where the endDate is greater than or equal to now and return the titles
     * FluroContent.retrieve({_type:'event', status:{$in:['active', 'archived'], endDate:{$gte:"date('now')"}}}, {select:'title'})
     */
    service.retrieve = function(criteria, options) {

        if (!options) {
            options = {}
        }

        return new Promise(function(resolve, reject) {


            var requestOptions = {
                params: {}
            }

            //If there are query string parameters
            if (options) {
                requestOptions.params = options;
            }

            /////////////////////////////////////////////

            //Retrieve the query results
            fluro.api.post(`/content/_query`, criteria, requestOptions).then(function(res) {

                resolve(res.data);

            }, reject);

        })
    }

    ///////////////////////////////////////////////////

    return service;

}


export default FluroContent;