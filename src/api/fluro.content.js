import _ from 'lodash';

///////////////////////////////////////////////////

var FluroContent = function(fluro) {

    if (!fluro.api) {
        throw new Error(`Can't Instantiate FluroContent before FluroAPI exists`);
    }

    //Keep track of any refresh requests
    var inflightRefreshRequest;

    ///////////////////////////////////////////////////

    var service = {}

    ///////////////////////////////////////////////////

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

    return service;

}


export default FluroContent;