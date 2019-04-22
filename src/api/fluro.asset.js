

/**
 * Creates a new FluroAsset instance.
 * This module provides a number of helper functions for managing asset, image, video and audio items in Fluro
 * 
 * @constructor
 * @param {FluroCore} fluro A reference to the parent instance of the FluroCore module. The FluroAsset module is usually created by a FluroCore instance that passes itself in as the first argument.
 */
var FluroAsset = function(Fluro) {


    if(!window){
        window = {
            screen:{
                width:1920,
                height:1080,
            },
        }
    }

    var isRetina = window.devicePixelRatio > 1;

    ///////////////////////////////////////////////////


    var service = {};

    ///////////////////////////////////////////////////

    function parameterDefaults(url, params) {

        ////////////////////////////////////

        //If an extension was provided add it to the url
        if (params.extension && params.extension.length) {

            if(params.title && params.title.length) {
                
                url += `/file/${params.title}.${params.extension}`;
                delete params.title;

            } else {
                if (params.filename && params.filename.length) {
                    url += `/file/${params.filename}.${params.extension}`;
                    delete params.filename;
                } else {
                    url += `/file/file.${params.extension}`;
                }
            }
            
            //Dont need to include it anymore
            delete params.extension;
        } else {
            if (params.filename && params.filename.length) {
                url += `/file/${params.filename}`;
                delete params.filename;
            }
        }

        ////////////////////////////////////

        //If we haven't requested without token
        if (!params.withoutToken) {
            //Get the current token from FluroAuth
            var CurrentFluroToken = Fluro.auth.getCurrentToken();

            //Check to see if we have a token and none has been explicity set
            if (!params['access_token'] && CurrentFluroToken) {
                //Use the current token by default
                params['access_token'] = CurrentFluroToken;
            }
        }

        return url;
    }

    ///////////////////////////////////////////////////

    /**
     * 
     * This function generates a url for the binary data of an
     * asset, image, audio, or video file that has been uploaded to Fluro
     * @alias FluroAsset.getUrl
     * @param  {string} assetID The _id of the item you want to retrieve
     * @param  {object} params      
     * @return {string}         A valid Fluro URL
     * @example
     * // returns 'https://api.fluro.io/get/5be504eabf33991239599d63'
     * FluroAsset.getUrl('5be504eabf33991239599d63')
     * // returns 'https://api.fluro.io/get/5be504eabf33991239599d63/file/MyFile.pdf'
     * FluroAsset.getUrl('5be504eabf33991239599d63', {filename:'MyFile.pdf'})
     */


    service.getUrl = function(assetID, params) {

        //Get the asset id as a pure string
        assetID = Fluro.utils.getStringID(assetID);

        if (!assetID || !String(assetID).length) {
            return;
        }

        if(!params) {
            params = {};
        }

        var url = `${Fluro.apiURL}/get/${assetID}`;

        ////////////////////////////////////////

        url = parameterDefaults(url, params);

        ////////////////////////////////////////

        //Map the parameters to a query string
        var queryParameters = Fluro.utils.mapParameters(params);

        if (queryParameters.length) {
            url += '?' + queryParameters;
        }

        return url;

    }



    ///////////////////////////////////////////////////

    /**
     * A helper function to generate a url for retrieving a user, persona or contact's avatar  
     * @alias FluroAsset.avatarUrl      
     * @param  {string} personID The id of the person you want to retrieve the avatar for
     * @param  {string} style    Can be 'contact', 'persona' or 'user'
     * @param  {object} params   
     * @param  {number} params.w The width of the image you are requesting from Fluro   
     * @param  {number} params.h The height of the image you are requesting from Fluro   
     * @return {string}          A full URL that links to the image the user is requesting
     */
    
    service.avatarUrl = function(personID, style, params) {

        //Get the id as a pure string
        personID = Fluro.utils.getStringID(personID);

        if (!personID || !String(personID).length) {
            return;
        }

        if(!params) {
            params = {};
        }

        if (!style) {
            style = 'contact';
        }

        var url = `${Fluro.apiURL}/get/avatar/${style}/${personID}`;

        ////////////////////////////////////////

        url = parameterDefaults(url, params);

        ////////////////////////////////////////

        //Map the parameters to a query string
        var queryParameters = Fluro.utils.mapParameters(params);

        if (queryParameters.length) {
            url += '?' + queryParameters;
        }

        return url;

    }

    ///////////////////////////////////////////////////


    /**
     * A helper function to retrieve the main image for an event, group, realm or other content
     * @alias FluroAsset.coverImage
     * @param  {string} contentID The id of the item you want to retrieve the image for
     * @param  {string} style    Can be 'event', 'group', 'tag' or 'realm'
     * @param  {object} params   
     * @param  {number} params.w The width of the image to request from Fluro   
     * @param  {number} params.h The height of the image to request from Fluro   
     * @return {string}          A full URL that links to the image the user is requesting
     */
    

    //Get the cover image for an event, group or realm
    service.coverImage = function(contentID, style, params) {

        //Get the id as a pure string
        contentID = Fluro.utils.getStringID(contentID);

        if (!contentID || !String(contentID).length) {
            return;
        }

        if(!params) {
            params = {};
        }

        if (!style) {
            style = 'event';
        }

        var url = `${Fluro.apiURL}/get/${style}/${contentID}`;

        ////////////////////////////////////////

        url = parameterDefaults(url, params);

        ////////////////////////////////////////

        //Map the parameters to a query string
        var queryParameters = Fluro.utils.mapParameters(params);

        if (queryParameters.length) {
            url += '?' + queryParameters;
        }

        return url;

    }


    ///////////////////////////////////////////////////

    /**
     * A helper function that returns a download url for a specific asset
     * @param  {string} assetID The id of the asset, or the asset object you want to download
     * @alias FluroAsset.downloadUrl
     * @param  {object} params   
     * @param  {string} params.filename The filename you want to download the file as
     * @param  {string} params.extension The extension of the file you want to download, eg. 'pdf'  
     * @return {string}          A full URL that will download the file
     */
    

    service.downloadUrl = function(assetID, params) {

        //Get the id as a pure string
        assetID = Fluro.utils.getStringID(assetID);

        if (!assetID || !String(assetID).length) {
            return;
        }

        if(!params) {
            params = {};
        }

        var url = `${Fluro.apiURL}/download/${assetID}`;

        ////////////////////////////////////////

        url = parameterDefaults(url, params);

        ////////////////////////////////////////

        //Map the parameters to a query string
        var queryParameters = Fluro.utils.mapParameters(params);

        if (queryParameters.length) {
            url += '?' + queryParameters;
        }

        return url;

    }


    ///////////////////////////////////////////////////
    
    /**
     * A helper function that returns a poster image for a specified video
     * @alias FluroAsset.posterUrl
     * @param  {string} videoID The id of the video, or a video object that has an _id property
     * @param  {number} width The width of the poster image. If none specified will default to 16:9 based on the requesting user's screen size
     * @param  {number} height The height of the poster image. If none specified will default to 16:9 based on the requesting user's screen size
     * @param  {object} params   
     * @return {string}          A full URL of the poster image
     */
    

    //Helper function for retrieving the poster image for a video
    service.posterUrl = function(videoID, w, h, params) {
        
        //Get the id as a pure string
        videoID = Fluro.utils.getStringID(videoID);

        if (!videoID || !String(videoID).length) {
            return;
        }

        if(!params) {
            params = {};
        }

        //////////////////////////////////////

        var screenWidth = window.screen.width || 1920;
        var screenHeight = window.screen.width || 1080;

        //////////////////////////////////////

        //Setup our usual width limit
        var limitWidth;

        //By default, limit the width
        if (isRetina) {
            limitWidth = 1920;
        } else {
            limitWidth = 1200;
        }

        //////////////////////////////////////

        //If the screen is smaller then 768 use an optimised image
        if (screenWidth <= 768) {
            if (isRetina) {
                limitWidth = 1536;
            } else {
                limitWidth = 768;
            }
        }

        //If using mobile then use a smaller optimised image
        if (screenWidth <= 320) {
            if (isRetina) {
                limitWidth = 640;
            } else {
                limitWidth = 320;
            }
        }

        //////////////////////////////////////////////////

        //If no width or height was specified
        if (!w && !h) {
            //Use our default width based on screen size
            params['w'] = limitWidth;
            params['h'] = Math.round(limitWidth * (9 /16));
        } else {

            //If a width was specified
            if (w) {
                params['w'] = w;

                if(!h) {
                    //If no height specified calculate based on aspect ratio
                    params['h'] = Math.round(w * (9 /16));
                }
            }

            //If a height was specified
            if (h) {
                params['h'] = h;
            }
        }
        
        //////////////////////////////////////////////////


        //Create the basic url
        var url = `${Fluro.apiURL}/get/${videoID}/poster`;

        ////////////////////////////////////////

        url = parameterDefaults(url, params);

        ////////////////////////////////////////

        //Map the parameters to a query string
        var queryParameters = Fluro.utils.mapParameters(params);

        if (queryParameters.length) {
            url += '?' + queryParameters;
        }

        ////////////////////////////////////////

        return url;
    }


    ///////////////////////////////////////////////////
    
    /**
     * A helper function that creates a url image for a specified image
     * @alias FluroAsset.imageUrl
     * @param  {string} imageID The id of the image or an object representing the image that has an _id property
     * @param  {number} width The width of the image to retrieve from Fluro. If none is specified then will default to a size based on the requesting user's screen dimensions.
     * @param  {number} height The height of the image to retrieve from Fluro. If none is specified then will default to a size based on the requesting user's screen dimensions.
     * @param  {object} params   
     * @param  {object} params.quality The quality of the image to retrieve from Fluro
     * @param  {object} params.filename The filename to use for the image url
     * @param  {object} params.extension An extension to use for the url if no filename is specified
     * @param  {object} params.extension An extension to use for the url if no filename is specified
     * @return {string}          A full URL of the image
     */
    

    //Helper function for retrieving the poster image for a video
    service.imageUrl = function(imageID, w, h, params) {
        
        //Get the id as a pure string
        imageID = Fluro.utils.getStringID(imageID);

        if (!imageID || !String(imageID).length) {
            return;
        }

        //////////////////////////////////////

        if(!params) {
            params = {};
        }

        //Create the basic url
        var url = Fluro.apiURL + '/get/' + imageID;

        //////////////////////////////////////

        //Setup our usual width limit
        var limitWidth;

        //By default, limit the width
        if (isRetina) {
            limitWidth = 1920;
        } else {
            limitWidth = 1200;
        }

        //////////////////////////////////////

        //If the screen is smaller then 768 use an optimised image
        if (window.screen.width <= 768) {
            if (isRetina) {
                limitWidth = 1536;
            } else {
                limitWidth = 768;
            }
        }

        //If using mobile then use a smaller optimised image
        if (window.screen.width <= 320) {
            if (isRetina) {
                limitWidth = 640;
            } else {
                limitWidth = 320;
            }
        }

        ////////////////////////////////////

        //If no width or height was specified
        if (!w && !h) {
            //Use our default limits
            params['w'] = limitWidth;
        } else {

            //If a width was specified
            if (w) {
                params['w'] = w;
            }

            //If a height was specified
            if (h) {
                params['h'] = h;
            }
        }

        ////////////////////////////////////////

        //Default to 90% quality huge compression gains
        if (!params.quality) {
            params.quality = 90;
        }

        ////////////////////////////////////////

        url = parameterDefaults(url, params);

        ////////////////////////////////////////

        //Map the parameters to a query string
        var queryParameters = Fluro.utils.mapParameters(params);

        if (queryParameters.length) {
            url += '?' + queryParameters;
        }

        ////////////////////////////////////////

        return url;
    }
    
    ///////////////////////////////////////

    /**
     * Helper function to translate bytes into a human readable format
     * @alias FluroAsset.filesize
     * @param  {Integer} bytes The number of bytes
     * @return {String}       The human readable filesize
     */
    service.filesize = function(bytes) {
       var sizes = ['Bytes', 'kb', 'mb', 'gb', 'tb'];
       if (bytes == 0) return '0 Byte';
       var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
       return Math.round(bytes / Math.pow(1024, i), 2) + '' + sizes[i];
    }

    ///////////////////////////////////////////////////

    return service;

}


export default FluroAsset;