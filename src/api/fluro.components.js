/**
 * Creates a new FluroComponents instance.
 * This module provides a number of helper functions for working with Fluro components
 * @alias fluro.components
 * @constructor
 * @param {FluroCore} fluro A reference to the parent instance of the FluroCore module. This module is usually created by a FluroCore instance that passes itself in as the first argument.
 */
var FluroComponents = function(fluro) {

    if (!fluro.utils) {
        throw new Error(`Can't Instantiate FluroComponents before FluroUtils exists`);
    }

    var service = {
        debug: false,
    }

    ///////////////////////////////////////////////////

    /**
     * Hydrates a data model by providing the component id
     * @alias fluro.components.hydrateModel	
     * @param  {String} componentID The id of the component that defines the fields
     * @param  {Object} model       The data model to hydrate
     * @return {Object}             A copy of the data model with all references populated
     */
    service.hydrateModel = function(componentID, model) {

        // console.log('>> Hydrate from server')
        return new Promise(function(resolve, reject) {

            fluro.api.post(`${fluro.apiURL}/components/${componentID}/hydrate`, model)
                .then(function(res) {
                    resolve(res.data);
                })
                .catch(reject);
        });
    }

    ///////////////////////////////////////////////////

    service.loadComponentModule = function(componentID, options) {
        if (!options) {
            options = {
                fields: true,
            };
        }

        ///////////////////////////////////

        var promise = fluro.utils.injectModule(`${fluro.apiURL}/components/${componentID}/module`, options)

        ///////////////////////////////////

        return promise;
    }

    ///////////////////////////////////////////////////

    return service;

}

/////////////////////////////////////////////

export default FluroComponents;