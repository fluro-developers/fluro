


///////////////////////////////////////////////////

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
    }

    ///////////////////////////////////////////////////

    service.getUrl = function(assetID, params) {

        if (!assetID || !String(assetID).length) {
            return;
        }

        if(!params) {
            params = {};
        }

        var url = `${Fluro.apiURL}/get/${assetID}`;

        ////////////////////////////////////////

        parameterDefaults(url, params);

        ////////////////////////////////////////

        //Map the parameters to a query string
        var queryParameters = Fluro.utils.mapParameters(params);

        if (queryParameters.length) {
            url += '?' + queryParameters;
        }

        return url;

    }



    ///////////////////////////////////////////////////

    service.avatarUrl = function(personID, style, params) {

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

        parameterDefaults(url, params);

        ////////////////////////////////////////

        //Map the parameters to a query string
        var queryParameters = Fluro.utils.mapParameters(params);

        if (queryParameters.length) {
            url += '?' + queryParameters;
        }

        return url;

    }

    ///////////////////////////////////////////////////

    //Get the cover image for an event, group or realm
    service.coverImage = function(contentID, style, params) {

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

        parameterDefaults(url, params);

        ////////////////////////////////////////

        //Map the parameters to a query string
        var queryParameters = Fluro.utils.mapParameters(params);

        if (queryParameters.length) {
            url += '?' + queryParameters;
        }

        return url;

    }


    ///////////////////////////////////////////////////

    service.downloadUrl = function(assetID, params) {

        if (!assetID || !String(assetID).length) {
            return;
        }

        if(!params) {
            params = {};
        }

        var url = `${Fluro.apiURL}/download/${assetID}`;

        ////////////////////////////////////////

        parameterDefaults(url, params);

        ////////////////////////////////////////

        //Map the parameters to a query string
        var queryParameters = Fluro.utils.mapParameters(params);

        if (queryParameters.length) {
            url += '?' + queryParameters;
        }

        return url;

    }


    ///////////////////////////////////////////////////
    
    //Helper function for retrieving the poster image for a video
    service.posterUrl = function(videoID, w, h, params) {
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

        parameterDefaults(url, params);

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
    
    //Helper function for retrieving the poster image for a video
    service.imageUrl = function(imageID, w, h, params) {
        if (!imageID || !String(imageID).length) {
            return;
        }

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
        if ($window.screen.width <= 768) {
            if (isRetina) {
                limitWidth = 1536;
            } else {
                limitWidth = 768;
            }
        }

        //If using mobile then use a smaller optimised image
        if ($window.screen.width <= 320) {
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

        parameterDefaults(url, params);

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

    return service;

}


export default FluroAsset;