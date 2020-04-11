import _ from 'lodash';
import moment from 'moment';
import axios from 'axios';
import { isBrowser, isNode } from 'browser-or-node';


///////////////////////////////////////////////////////////////////////////////

/**
 * @classdesc A static service that provides useful helper functions and tools for other Fluro services
 * @class
 * @hideconstructor
 */
var FluroUtils = {};

///////////////////////////////////////////////////////////////////////////////

/**
 * A helpful function that can take a keyed object literal and map it to url query string parameters
 * @alias FluroUtils.mapParameters
 * @param  {Object} parameters The object you want to transalte
 * @return {String}            The query string
 * @example 
 * //Returns &this=that&hello=world
 * FluroUtils.mapParameters({"this":"that", "hello":"world"})
 */
FluroUtils.mapParameters = function(parameters) {
    return _.chain(parameters)
        .map(function(v, k) {
            if (v === undefined || v === null || v === false) {
                return;
            }

            return encodeURIComponent(k) + '=' + encodeURIComponent(v);
        })
        .compact()
        .value()
        .join('&');
}




///////////////////////////////////////////////////////////////////////////////

/**
 * A function that will take an integer and a currency string and return a formatted numeric amount rounded to 2 decimal places
 * @alias FluroUtils.formatCurrency
 * @param  {Integer} value The amount in cents
 * @param  {String} currency The currency to format
 * @return {String}            The formatted value
 * @example 
 * 
 * //Returns £10.00
 * FluroUtils.formatCurrency(1000, 'gbp');
 * 
 * //Returns $10.00
 * FluroUtils.formatCurrency(1000, 'usd');
 * 
 */
FluroUtils.formatCurrency = function(value, currency) {

    if (!value || isNaN(value)) {
        value = 0;
    }

    var currencyPrefix = FluroUtils.currencySymbol(currency);
    return `${currencyPrefix}${parseFloat(parseInt(value) / 100).toFixed(2)}`;

}


/**
 * A function that will take a currency string and return the symbol
 * @alias FluroUtils.currencySymbol
 * @param  {String} currency The currency
 * @return {String}            The symbol
 * @example 
 * 
 * //Returns £
 * FluroUtils.currencySymbol('gbp');
 * 
 * //Returns $
 * FluroUtils.currencySymbol('usd');
 * 
 */
FluroUtils.currencySymbol = function(currency) {
    //Ensure lowercase currency
    currency = String(currency).toLowerCase();

    switch (String(currency).toLowerCase()) {
        case 'gbp':
            return '£';
            break;
        case 'eur':
            return '€';
            break;
        default:
            return '$';
            break;
    }
}

///////////////////////////////////////////////////////////////////////////////

/**
 * A helpful function for creating a fast hash object that can be used for more efficient loops
 * @alias FluroUtils.hash
 * @param  {Array} array The array to reduce
 * @param  {String} key The key or path to the property to group by
 * @return {Object}            A hash object literal
 * @example 
 * //Returns {something:[{title:'test', definition:'something'}]}
 * FluroUtils.mapReduce([{title:'test', definition:'something'}], 'definition');
 * 
 */
FluroUtils.hash = function(array, key) {

    return _.reduce(array, function(set, item) {

        var key = _.get(item, key);
        set[key] = item;
        return set;
    }, {});
}


///////////////////////////////////////////////////////////////////////////////

/**
 * A helpful function that can create a globally unique id
 * @alias FluroUtils.guid
 * @return {String}            The new guid
 * @example 
 * //Returns 20354d7a-e4fe-47af-8ff6-187bca92f3f9
 * FluroUtils.guid()
 */
FluroUtils.guid = function() {
    var u = (new Date()).getTime().toString(16) +
        Math.random().toString(16).substring(2) + "0".repeat(16);
    var guid = u.substr(0, 8) + '-' + u.substr(8, 4) + '-4000-8' +
        u.substr(12, 3) + '-' + u.substr(15, 12);

    return guid;
}



//////////////////////////////////////////////////

/**
 * A helper function to extract a default value from a fluro field definition
 * @alias FluroUtils.getDefaultValueForField
 * @return {String|Number|Object}            The default value
 */
FluroUtils.getDefaultValueForField = function(field) {

    var blankValue;
    var multiple = field.maximum != 1;

    //Check if it's a nested subgroup or embedded form
    var nested = ((field.type == 'group' && field.asObject) || field.directive == 'embedded');

    ///////////////////////////////////////

    if (multiple) {
        blankValue = [];
    }

    ///////////////////////////////////////

    switch (field.type) {
        case 'reference':
            if (field.defaultReferences && field.defaultReferences.length) {
                if (multiple) {
                    blankValue = blankValue.concat(field.defaultReferences);

                } else {
                    blankValue = _.first(field.defaultReferences);
                }
            }
            break;
        default:
            if (field.defaultValues && field.defaultValues.length) {
                if (multiple) {
                    blankValue = blankValue.concat(field.defaultValues);

                } else {
                    blankValue = _.first(field.defaultValues);
                }
            }
            break;
    }

    ///////////////////////////////////////


    if (multiple) {

        var askCount = Math.max(field.askCount, field.minimum);
        var additionalRequired = Math.max((askCount - blankValue.length), 0);

        //If we need some entries by default
        if (additionalRequired) {

            switch (field.type) {
                // case 'string':
                //     _.times(additionalRequired, function() {
                //         blankValue.push('');
                //     })
                //     break;
                default:
                    switch (field.directive) {
                        case 'wysiwyg':
                        case 'textarea':
                        case 'code':
                            _.times(additionalRequired, function() {
                                blankValue.push('');
                            })
                            break;
                        default:
                            //We need to add objects
                            if (nested) {
                                _.times(additionalRequired, function() {
                                    blankValue.push({});
                                })
                            }
                            break;
                    }
                    break;
            }

        }
    } else {

        if (!blankValue) {

            switch (field.type) {
                // case 'string':
                //     blankValue = '';
                // break;
                default:
                    switch (field.directive) {
                        case 'wysiwyg':
                        case 'textarea':
                        case 'code':
                            // case 'select':
                            blankValue = '';
                            break;
                        default:
                            //We need to add objects
                            if (nested) {
                                blankValue = {};
                            }
                            //  else {
                            //     blankValue =  null;
                            // }
                            break;
                    }
                    break;
            }
        }
    }

    ///////////////////////////////////////

    return blankValue;
}



//////////////////////////////////////////////////////

/**
 * A helpful function that can return a subset of an array compared to specified criteria, This is usually used
 * to evaluate expressions on Fluro forms
 * @alias FluroUtils.matchInArray
 * @param  {Array} array The array you want to filter
 * @param  {String} path The path to the property you want to compare on each item in the array
 * @param  {String} value The value to compare with
 * @param  {String} operator Can be Possible options are ('>', '<', '>=', '<=', 'in', '==') Defaults to '==' (Is equal to)
 * @return {Array}           An array that contains all items that matched
 * @example 
 * //Returns {name:'Jerry', age:26} as that is only item in the array that matches the criteria
 * FluroUtils.matchInArray([{name:'Jerry', age:26}, {name:'Susan', age:19}], 'age', 26, '>=');
 * 
 */
FluroUtils.matchInArray = function(array, key, value, operator) {

    //Filter the array options by a certain value and operator
    var matches = _.filter(array, function(entry) {
        //Get the value from the object
        var retrievedValue = _.get(entry, key);
        var isMatch;

        ///////////////////////

        //Check how to operate
        switch (operator) {
            case '>':
                isMatch = (retrievedValue > value);
                break;
            case '<':
                isMatch = (retrievedValue < value);
                break;
            case '>=':
                isMatch = (retrievedValue >= value);
                break;
            case '<=':
                isMatch = (retrievedValue <= value);
                break;
            case 'in':
                isMatch = _.includes(retrievedValue, value);
                break;
            default:
                //operator is strict equals
                if (value === undefined) {
                    isMatch = retrievedValue;
                } else {
                    isMatch = (retrievedValue == value);
                }
                break;
        }

        ///////////////////////

        return isMatch;
    })

    return matches;
}

///////////////////////////////////////////////////////////////////////////////

/**
 * A helpful class that can take an array of values and return them as a comma seperated
 * string, If the values are objects, then a property to use as the string representation can be specified
 * @alias FluroUtils.comma
 * @param  {Array} array The array of values to translate
 * @param  {String} path  An optional property key to use for each value
 * @return {String}       The resulting comma seperated string
 * @example
 * //Returns 'cat, dog, bird'
 * FluroUtils.comma(['cat', 'dog', 'bird']);
 * 
 * //Returns 'cat, dog, bird'
 * FluroUtils.comma([{title:'cat'}, {title:'dog'}, {title:'bird'}], 'title');
 */
FluroUtils.comma = function(array, path, limit) {

    if (limit) {
        array = array.slice(0, limit);
    }

    return _.chain(array)
        .compact()
        .map(function(item) {
            if (path && path.length) {
                return _.get(item, path);
            }

            return item;
        })
        .value()
        .join(', ');

}

///////////////////////////////////////////////////////////////////////////////

//Helper function to get an id of an object

/**
 * Returns a specified _id for an object
 * @alias FluroUtils.getStringID
 * @param  {Object} input      An object that is or has an _id property
 * @param  {Boolean} asObjectID Whether to convert to a Mongo ObjectId
 * @return {String}            Will return either a string or a Mongo ObjectId
 *
 * @example
 *
 * //Returns '5cb3d8b3a2219970e6f86927'
 * FluroUtils.getStringID('5cb3d8b3a2219970e6f86927')
 *
 * //Returns true
 * typeof FluroUtils.getStringID({_id:'5cb3d8b3a2219970e6f86927', title, ...}) == 'string';

 * //Returns true
 * typeof FluroUtils.getStringID({_id:'5cb3d8b3a2219970e6f86927'}, true) == 'object';
 */
FluroUtils.getStringID = function(input, asObjectID) {

    if (!input) {
        return input;
    }

    /////////////////////////////////

    var output;

    if (input._id) {
        output = String(input._id);
    } else {
        output = String(input);
    }

    if (!asObjectID || isBrowser) {
        // console.log('NORMAL', asObjectID, isBrowser)
        return output;
    }

    return output;

    // //Load mongoose if we can
    // try {
    //     var mongoose = require('mongoose');
    // } catch(e) {
    //     console.log('ERROR', e);
    //     return output;
    // }

    // // console.log('Type as object id')
    // var ObjectId = mongoose.Types.ObjectId;
    // var isValid = ObjectId.isValid(String(output));
    // if (!isValid) {
    //     return;
    // }

    // return new ObjectId(output);



}





///////////////////////////////////////////////////////////////////////////////

/**
 * Cleans and maps an array of objects to an array of IDs  
 * @alias FluroUtils.arrayIDs      
 * @param  {Array} array      An array of objects or object ids
 * @param  {Boolean} asObjectID Whether or not to map the ids as Mongo ObjectIds
 * @return {Array}            An array of Ids
 *
 * @example
 * //Returns ['5cb3d8b3a2219970e6f86927', '5cb3d8b3a2219970e6f86927', '5cb3d8b3a2219970e6f86927']
 * FluroUtils.arrayIDs([{_id:'5cb3d8b3a2219970e6f86927'}, {_id:'5cb3d8b3a2219970e6f86927'}, null, '5cb3d8b3a2219970e6f86927'])
 */
FluroUtils.arrayIDs = function(array, asObjectID) {

    if (!array) {
        return array;
    }

    return _.chain(array)
        .compact()
        .map(function(input) {
            return FluroUtils.getStringID(input, asObjectID);
        })
        .compact()
        .uniq()
        .value();

}

///////////////////////////////////////////////////////////////////////////////

/**
 * Helper function for retrieving a human readable error message from server error response objects
 * @alias FluroUtils.errorMessage
 * @param  {Object} error The error object to translate    
 * @return {String}     The resulting human readable error message
 */
FluroUtils.errorMessage = function(err) {


    if (_.isArray(err)) {
        err = _.first(err);
    }

    ////////////////////////////////////

    var candidates = [
        'response.data.message',
        'response.data',
        'message',
    ]

    ////////////////////////////////////

    var message = _.chain(candidates)
        .map(function(path) {
            return _.get(err, path);
        })
        .compact()
        .first()
        .value();

    ////////////////////////////////////

    if (Array.isArray(message)) {
        message = message[0];
    }

    ////////////////////////////////////

    if (!message || !message.length) {
        return String(err);
    }

    ////////////////////////////////////

    return message;
}


/////////////////////////////////////////////
/////////////////////////////////////////////



/**
 * Helper function for sorting process cards by priority
 * @alias FluroUtils.processCardPrioritySort
 * @param  {Object} card The process card to sort
 * @return {Integer}     An integer representing it's sorting priority
 */


FluroUtils.processCardPrioritySort = function(card) {

    var num = '2';
    var trailer = 0;
    var val;

    ///////////////////////////////////////////

    //If we are archived then add straight to the bottom of the list
    if (card.status == 'archived') {
        num = '4';
        val = parseFloat(num + '.' + trailer);
        return val + '-' + card.title;
    }

    ///////////////////////////////////////////

    //If we are complete then add us to the bottom of the list
    if (card.processStatus == 'complete') {
        num = '3';
        val = parseFloat(num + '.' + trailer);
        return val + '-' + card.title;
    }

    ///////////////////////////////////////////

    if (card.dueDate) {

        var dueMoment = moment(card.dueDate);
        var dueDate = dueMoment.toDate();

        var nowMoment = moment();
        var now = nowMoment.toDate();

        var duetime = dueDate.getTime();
        trailer = dueDate.getTime()

        if (duetime < now.getTime()) {
            //If it's overdue then we add it to the very very top
            num = '0';
        } else {
            //Otherwise just add it to the top of the 
            //pending cards
            num = '1';
        }
    }

    ///////////////////////////////////////////

    var val = parseFloat(num + '.' + trailer);

    return val + '-' + card.title;

}


////////////////////////////////////
////////////////////////////////////
////////////////////////////////////

/**
 * Helper function for cleaning strings to use as database ids
 * @alias FluroUtils.machineName
 * @param  {String} string The string to clean eg. (Awesome Event!)
 * @return {String}     A cleaned and formatted string eg. (awesomeEvent)
 */

FluroUtils.machineName = function(string) {

    if (!string || !string.length) {
        return;
    }

    var regexp = /[^a-zA-Z0-9-_]+/g;
    return string.replace(regexp, '');
}


////////////////////////////////////


FluroUtils.hhmmss = function(secs) {
    function pad(str) {
        return ("0" + str).slice(-2);
    }
    var minutes = Math.floor(secs / 60);
    secs = secs % 60;
    var hours = Math.floor(minutes / 60)
    minutes = minutes % 60;
    return pad(hours) + ":" + pad(minutes) + ":" + pad(secs);
}

////////////////////////////////////


var injectedScripts = {}
/**
 * Helper function for including external javascript resources
 * This ensures that scripts are only included a single time on each page
 * @alias FluroUtils.injectScript
 * @param  {String} url The URL of the script to import
 * @return {Promise}     A promise that resolves once the script has been included on the page
 */

FluroUtils.injectScript = function(scriptURL) {

    return new Promise(function(resolve, reject) {

        if (!document) {
            return reject('Script injection can only be used when running in a browser context')
        }

        if (injectedScripts[scriptURL]) {
            return resolve(scriptURL);
        }


        //Keep note so we don't inject twice
        injectedScripts[scriptURL] = true;

        //////////////////////////////////////

        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.onload = function() {
            console.log('Included external script', scriptURL);
            return resolve(scriptURL);
        };
        script.src = scriptURL;
        document.getElementsByTagName('head')[0].appendChild(script);

        ////////////////////////////////////




    })
}


////////////////////////////////////

/**
 * Helper function for including external javascript resources
 * This ensures that scripts are only included a single time on each page
 * @alias FluroUtils.injectModule
 * @param  {String} url The URL of the script to import
 * @return {Promise}     A promise that resolves once the script has been included on the page
 */

var inflightPromises = {};


FluroUtils.injectModule = function(scriptURL, options) {

    if (!options) {
        options = {};
    }

    ////////////////////////////////////////////////////

    if (!document) {
        return Promise.reject('Script injection can only be used when running in a browser context');
    }

    ////////////////////////////////////////////////////

    //If we aren't requesting a cache clear
    if (!options.clearCache) {

        //If there is an inflight promise
        if (inflightPromises[scriptURL]) {
            return inflightPromises[scriptURL];
        }
    }

    ////////////////////////////////////////////////////

    var promise = new Promise(function(resolve, reject) {
        axios.get(scriptURL).then(function(res) {
            var source = res.data;
            var script = `"use strict"; var object = {}; try {object = ${source}} catch(e) {console.log(e)} finally {return object}`;


            var compiled = Function(script)();
            return resolve(compiled);
        })


    })

    ////////////////////////////////////////////////////

    //Cache for multiple requests
    inflightPromises[scriptURL] = promise;

    return promise;
}

/////////////////////////////////////////////
/////////////////////////////////////////////
/////////////////////////////////////////////
/////////////////////////////////////////////
/////////////////////////////////////////////


export default FluroUtils;


/////////////////////////////////////////////

//Export the event dispatcher
export function EventDispatcher() {

    var listeners = {};

    /////////////////////////////////////////////

    var dispatcher = {}

    /////////////////////////////////////////////

    //Remove all listeners
    dispatcher.removeAllListeners = function() {
        listeners = {};
    }

    /////////////////////////////////////////////

    dispatcher.dispatch = function(event, details) {

        if (listeners[event]) {

            // console.log('Listeners', event, listeners[event]);
            //For each listener
            listeners[event].forEach(function(callback) {
                //Fire the callback
                // console.log('Fire listener', event, details);
                return callback(details);
            });
        }
    }

    /////////////////////////////////////////////

    dispatcher.addEventListener = function(event, callback) {

        if (!listeners[event]) {
            listeners[event] = [];
        }

        if (listeners[event].indexOf(callback) == -1) {
            //Add to the listeners
            listeners[event].push(callback)
        } else {
            //Already listening
        }
    }

    /////////////////////////////////////////////

    dispatcher.removeEventListener = function(event, callback) {

        if (!listeners[event]) {
            listeners[event] = [];
        }

        //Get the index of the listener
        var index = listeners[event].indexOf(callback);

        if (index != -1) {
            //Remove from the listeners
            listeners[event].splice(index, 1);
        }
    }


    /////////////////////////////////////////////

    //Wrap the event listener functionality
    dispatcher.bootstrap = function(service) {
        if (!service) {
            // console.log('No service to bootstrap to')
            return;
        }

        service.dispatch = dispatcher.dispatch;
        service.addEventListener = dispatcher.addEventListener;
        service.removeEventListener = dispatcher.removeEventListener;
        service.removeAllListeners = dispatcher.removeAllListeners;
    }

    /////////////////////////////////////////////

    return dispatcher;
}