import _ from 'lodash';

///////////////////////////////////////////////////////////////////////////////

var FluroUtils = {};

///////////////////////////////////////////////////////////////////////////////

FluroUtils.mapParameters = function(parameters) {
    return _.map(parameters, function(v, k) {
        return encodeURIComponent(k) + '=' + encodeURIComponent(v);
    }).join('&');
}


///////////////////////////////////////////////////////////////////////////////

FluroUtils.comma = function(array, path) {

    return _.chain(array)
    .compact()
    .map(function(item) {
        if(path) {
            return _.get(item, path);
        }

        return item;
    })
    .value()
    .join(', ');
    
}

///////////////////////////////////////////////////////////////////////////////


///////////////////////////////////////////////////////////////////////////////

//Helper function to get an id of an object

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

    if (!asObjectID) {
        return output;
    }

    return output;
    // var mongoose = require('mongoose');
    // var ObjectId = mongoose.Types.ObjectId;

    // var isValid = ObjectId.isValid(String(output));
    // if(!isValid) {
    // return;
    // }

    // return new ObjectId(output);

}

///////////////////////////////////////////////////////////////////////////////

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

FluroUtils.errorMessage = function(err) {


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
    
    if (!message || !message.length) {
        return String(err);
    }

    ////////////////////////////////////

    return message;
}



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

        if(listeners[event]) {

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

        if(!listeners[event]) {
            listeners[event] = [];
        }

        if(listeners[event].indexOf(callback) == -1) {
            //Add to the listeners
            listeners[event].push(callback)
        } else {
            //Already listening
        }
    }

    /////////////////////////////////////////////
    
    dispatcher.removeEventListener = function(event, callback) {

        if(!listeners[event]) {
            listeners[event] = [];
        }

        //Get the index of the listener
        var index = listeners[event].indexOf(callback);

        if(index != -1) {
            //Remove from the listeners
            listeners[event].splice(index,1);
        }
    }


    /////////////////////////////////////////////

    //Wrap the event listener functionality
    dispatcher.bootstrap = function(service) {
        if(!service) {
            // console.log('No service to bootstrap to')
            return;
        }

       service.addEventListener = dispatcher.addEventListener;
       service.removeEventListener = dispatcher.removeEventListener;
       service.removeAllListeners = dispatcher.removeAllListeners;
    }
    
    /////////////////////////////////////////////

    return dispatcher;
}