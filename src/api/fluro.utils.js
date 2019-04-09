

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

FluroUtils.arrayIDs = function(array, asObjectID) {

    if(!array) {
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

//Helper function to get an id of an object
FluroUtils.getStringID = function(input, asObjectID) {

    if(!input) {
        return input;
    }

    /////////////////////////////////

    var output;

    if(input._id) {
        output = String(input._id);
    } else {
        output = String(input);
    }
    
    if(!asObjectID) {
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