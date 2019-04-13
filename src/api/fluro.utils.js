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





export default FluroUtils;