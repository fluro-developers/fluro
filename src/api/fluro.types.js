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

    /**
     * Retrieves a list of specified types and their respective definitions
     * @alias FluroTypes.retrieve
     * @param  {array} types The names of the basic types you want to retrieve
     * @return {promise}       An promise that will resolve to the matching basic types or reject with the responding error
     */
    service.retrieve = function(types, options) {

        if(!options) {
            options = {
                // flat:true
            }
        }

        options.types = types;

        ///////////////////////////

        var promise = FluroCore.api.post('/defined', options);

        // promise.then(function(res) {
        //     // store.ids[id] = res.data.total;
        //     // inProgress[id] = false;
        // }, function() {
        //     // inProgress[id] = false;
        // })

        return promise;

    }

    //////////////////////////////////

    return service;

}

///////////////////////////////////////////////////////////////////////////////



export default FluroTypes;