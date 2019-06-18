

console.log('fluro v1.1')

//Import the pieces we need
import FluroCore from './api/fluro.core';
import FluroUtils from './api/fluro.utils';


//Add Utils as a static property
FluroCore.utils = FluroUtils;


////////////////////////////////////////////

export default FluroCore;
