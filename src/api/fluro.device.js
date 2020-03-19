///////////////////////////////////////////////////////////////////////////////

/**
 * @classdesc A static service that provides device and screen information
 * @class
 * @hideconstructor
 */



///////////////////////////////////////////////////////////////////////////////

var FluroDevice = function() {

    var service = {
        breakpoint: {
            mobile: false,
            tablet: false,
            desktop: false,
        },
    };

    ////////////////////////////////

    var mounted;
    let WindowReference;

    ////////////////////////////////

    service.resize = function() {

        var width = Math.max(WindowReference.innerWidth || 0);
        var height = Math.max(WindowReference.innerHeight || 0);

        service.screen = {
            width,
            height,
        }

        var mobile;
        var tablet;
        var desktop;

        if (width < 768) {
            mobile = true;
            // console.log('- mobile')
        }

        if (width >= 768 && width <= 1024) {
            tablet = true;
            // console.log('- tablet')
        }

        if (width > 1024) {
            desktop = true;
            // console.log('- desktop')
        }

        //Update the breakpoint
        service.breakpoint.mobile = mobile;
        service.breakpoint.tablet = tablet;
        service.breakpoint.desktop = desktop;

        // console.log('Device size changed', width, height, WindowReference)
    }




    ////////////////////////////////

    service.mount = function(window) {
        if (mounted) {
            return;
        }

        WindowReference = window;
        mounted = true;
        WindowReference.addEventListener('resize', service.resize);
        service.resize();
    }


    ////////////////////////////////

    service.destroy = function() {
        WindowReference.removeEventListener('resize', service.resize);
    }

    ////////////////////////////////

    // if (!(typeof window === 'undefined')) {
    //     service.mount(window);
    // }

    ////////////////////////////////

    return service;

}

///////////////////////////////////////////////////////////////////////////////


export default FluroDevice;