import _ from 'lodash';

///////////////////////////////////////////////////////////////////////////////

var FluroTypes = function(FluroCore) {

    console.log('CREATED FLURO TYPES')

    var service = {};

    //////////////////////////////////

    /**
     * Retrieves a list of specified types and their respective definitions
     * @param  {array} types The names of the basic types you want to retrieve
     * @return {promise}       An promise that will resolve to the matching basic types
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