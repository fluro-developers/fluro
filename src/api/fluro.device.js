///////////////////////////////////////////////////////////////////////////////

/**
 * @classdesc A static service that provides device and screen information
 * @class
 * @hideconstructor
 */





///////////////////////////////////////////////////////////////////////////////

// class FluroDevice {

// 	var service = {
// 		screen: {
//             width: 1024,
//             height: 768,
//         },
//         limits: {
//             xs: 600,
//             sm: 960,
//             md: 1264,
//             lg: 1904,
//         },
//         breakpoint: {
//             mobile: false,
//             tablet: false,
//             desktop: false,

//             ///////////////////////

//             xs: false,
//             sm: false,
//             md: false,
//             lg: false,
//             xl: false,
//             xsOnly: false,
//             smOnly: false,
//             smAndDown: false,
//             smAndUp: false,
//             mdOnly: false,
//             mdAndDown: false,
//             mdAndUp: false,
//             lgOnly: false,
//             lgAndDown: false,
//             lgAndUp: false,
//             xlOnly: false,
//             width: 0,
//             height: 0,
//         },
// 	}


//     constructor(defaults) {
//         if (!defaults) {
//             defaults = {};
//         }


//     }

//     get name() {
//         return this._name.toUpperCase();
//     }

//     set name(newName) {
//         this._name = newName; // validation could be checked here such as only allowing non numerical values
//     }

//     walk() {
//         console.log(this._name + ' is walking.');
//     }
// }




var FluroDevice = function() {

    var service = {
        screen: {
            width: 1024,
            height: 768,
        },
        limits: {
            xs: 600,
            sm: 960,
            md: 1264,
            lg: 1904,
        },
        breakpoint: {
            mobile: false,
            tablet: false,
            desktop: false,

            ///////////////////////

            xs: false,
            sm: false,
            md: false,
            lg: false,
            xl: false,
            xsOnly: false,
            smOnly: false,
            smAndDown: false,
            smAndUp: false,
            mdOnly: false,
            mdAndDown: false,
            mdAndUp: false,
            lgOnly: false,
            lgAndDown: false,
            lgAndUp: false,
            xlOnly: false,
            width: 0,
            height: 0,
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

        ///////////////////////////////////////////


        ///////////////////////////////////////////

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