///////////////////////////////////////////////////////////////////////////////

/**
 * @classdesc A static service that provides device and screen information
 * @class
 * @hideconstructor
 */

///////////////////////////////////////////////////////////////////////////////

var FluroDevice = function(window) {

    var service = {
        breakpoint: {
            mobile: false,
            tablet: false,
            desktop: false,
        },
    };

    ////////////////////////////////

    service.resize = function() {

        var width = Math.max(window.innerWidth || 0);
        var height = Math.max(window.innerHeight || 0);

        service.screen = {
            width,
            height,
        }

        var mobile;
        var tablet;
        var desktop;

        if (width <= 320) {
            mobile = true;
        }

        if (width > 320 && width <= 768) {
            tablet = true;
        }

        if (width > 768) {
            desktop = true;
        }

        //Update the breakpoint
        service.breakpoint.mobile = mobile;
        service.breakpoint.tablet = tablet;
        service.breakpoint.desktop = desktop;

        // console.log('Resized', width, height, window)
    }


    ////////////////////////////////

    window.addEventListener('resize', service.resize);
    service.resize();


    ////////////////////////////////

    service.destroy = function() {
        window.removeEventListener('resize', service.resize);
    }

    ////////////////////////////////

    return service;

}

///////////////////////////////////////////////////////////////////////////////


export default FluroDevice;