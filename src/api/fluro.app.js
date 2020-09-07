///////////////////////////////////////////////////////////////////////////////


/**
 * @classdesc A reactive VueJS service available only within apps and websites built with the Fluro Web Builder. It provides helpful functions including for navigating around your app, accessing native mobile APIs and playback of media content.
 * @alias fluro.app
 * @class
 * @hideconstructor
 */





// //Setup a reactive object for our things
// var FluroApp = new Vue({
//     data() {

//         var session;
//         if (process.browser) {
//             var storedSession = window.localStorage.getItem('fluroAppUser');
//             if (storedSession) {
//                 session = JSON.parse(storedSession);
//                 //console.log('retrieved user from storage');
//             }
//         }

//         return {
//             session,
//             device: self.$fluro.device(),
//             layers: [],
//             builder: self,
//             global: Vue.observable({}),
//             audioPlayer: new Audio(),
//             notifications: [],
//             breadcrumb: BreadcrumbService,
//         }
//     },
//     methods: {
//         //$fluro.app.to({name:'home', query:'blah', params:{}});
//         //$fluro.app.to('/something');
//         to(to) {
//             console.log('SET BUILDER ROUTE TO', to)
//             return this.$fluro.app.setBuilderRoute(to);
//         },
//         notificationReceived(notification, userAction) {
//             var self = this;

//             self.notifications.push(notification);
//             if (userAction) {
//                 var path = _.get(notification, 'data.path');
//                 if (path) {
//                     self.$router.push(path);
//                 }
//             }


//             self.$emit('notification', notification);
//         },
//         deviceMode() {
//             return 'web';
//         },
//         getBuilder() {
//             return self;
//         },
//         getPage(pageName) {





//             var match;

//             function findMatchingRoute(array, name) {



//                 _.each(array, function(route) {
//                     if (route.state == name) {
//                         match = route;
//                         return;
//                     }

//                     if (match) {
//                         return;
//                     }

//                     //We still don't have a match but there are sub routes
//                     if (route.routes && route.routes.length) {
//                         findMatchingRoute(route.routes, name);
//                     }
//                 })


//             }

//             /////////////////////////////////////////////


//             findMatchingRoute(self.siteRoutes, pageName);

//             return match;


//         },
//         setBuilderRoute(routeParams) {

//             var match;


//             // //console.log('Find match', routeParams);

//             function findMatchingRoute(array, params) {

//                 _.each(array, function(route) {
//                     if (route.state == params.name) {
//                         match = route;
//                         return;
//                     }

//                     if (match) {
//                         return;
//                     }

//                     //We still don't have a match but there are sub routes
//                     if (route.routes && route.routes.length) {
//                         findMatchingRoute(route.routes, params);
//                     }
//                 })
//             }

//             ////////////////////////////////////////////////


//             findMatchingRoute(self.siteRoutes, routeParams);

//             if (!match) {
//                 return;
//             }


//             if (!match.testParams) {
//                 self.$set(match, 'testParams', routeParams.params);
//             } else {
//                 _.assign(match.testParams, routeParams.params);
//             }



//             //console.log('SELECT ROUTE', match.testParams, routeParams)
//             self.clickedRoute(match);
//             // //console.log('MATCH', match, self.siteRoutes, routeParams);
//         },
//         addLayer(options, drawer, additional) {

//             if (!options) {
//                 options = {};
//             }

//             var self = this;
//             if (!drawer) {
//                 drawer = 'modal';
//             }

//             // var index = self.layers.length;
//             return new Promise(function(resolve, reject) {
//                 var index = self.layers.length;;
//                 options.layerID = index;
//                 options.resolve = resolve;
//                 options.reject = reject;
//                 self.layers.push({ index, options, drawer });
//             });
//         },
//         removeLayer(index) {
//             var self = this;

//             var matchingPanelIndex = _.findIndex(self.layers, { index: index });
//             if (matchingPanelIndex != -1) {
//                 var target = self.layers[matchingPanelIndex];
//                 self.layers.splice(matchingPanelIndex, 1);
//                 if (target.options.resolve) {
//                     target.options.resolve();
//                 }
//             }
//         },
//         clearLayers(drawer) {

//             var layers = (this.layers || []).slice();
//             this.layers = [];
//             _.each(layers, function(layer) {
//                 layer.options.reject();
//             })

//         },
//         //  audioPlayer() {

//         //     //console.log('GET AUDIO', this.audioElement);
//         //     if(this.audioElement) {
//         //         //console.log('return existing audio element')
//         //         return this.audioElement;
//         //     }

//         //     if(!window) {
//         //         return;
//         //     }

//         //     var audio = new Audio();
//         //     this.$set(this, 'audioElement', audio);

//         //     //console.log('created new audio element')

//         //     return audio;
//         // },

//     },
//     computed: {

//         proMode() {
//             return this.$pro.enabled;
//         },
//         user: {
//             get() {
//                 return this.session;
//             },
//             set(payload) {
//                 if (this.session != payload) {
//                     this.session = payload;
//                     if (process.browser) {
//                         if (payload) {
//                             window.localStorage.setItem('fluroAppUser', JSON.stringify(payload));
//                             //console.log('saved user to storage');
//                         } else {
//                             window.localStorage.setItem('fluroAppUser', null);
//                             //console.log('removed user from storage');
//                         }
//                     }
//                     this.$emit('user', payload);
//                 }

//             }
//         },
//         site() {
//             return self.site;
//         },
//         themes() {
//             return self.site.themes;
//         },
//         // breakpoint() {

//         //     // var width = 0;
//         //     // var height = 0;

//         //     // if (process.browser) {
//         //     //     var width = Math.max(window.innerWidth || 0);
//         //     //     var height = Math.max(window.innerHeight || 0);
//         //     // }

//         //     // var object = {
//         //     //     xs: false,
//         //     //     sm: false,
//         //     //     md: false,
//         //     //     lg: false,
//         //     //     xl: false,
//         //     //     xsOnly: false,
//         //     //     smOnly: false,
//         //     //     smAndDown: false,
//         //     //     smAndUp: false,
//         //     //     mdOnly: false,
//         //     //     mdAndDown: false,
//         //     //     mdAndUp: false,
//         //     //     lgOnly: false,
//         //     //     lgAndDown: false,
//         //     //     lgAndUp: false,
//         //     //     xlOnly: false,
//         //     //     width,
//         //     //     height,
//         //     // }

//         //     // if ()


//         // },
//         menu() {
//             return _.reduce(this.site.menus, function(set, menu) {
//                 if (!menu) {
//                     return set
//                 }

//                 if (!menu.key) {
//                     return set
//                 }

//                 set[menu.key] = menu;
//                 return set;
//             }, {});
//         },
//         page() {


//             //console.log('DYNAMIC ROUTE', self.routeHREF)
//             // //console.log('Dynamic items was changed', self.dynamicURLTokens, self.dynamicURLItems);

//             var pageObject = {
//                 title: self.route.title,
//                 name: self.route.state,
//                 params: _.reduce(self.route.testParams || {}, function(set, value, key) {

//                     var cleanKey = _.camelCase(key);
//                     set[cleanKey] = value;
//                     return set
//                 }, {}),
//                 path: self.route.url,
//                 href: self.routeHREF,
//                 items: self.dynamicURLItems,
//                 query: {},
//             }



//             return pageObject;
//         },
//     },
// })

/**
 * @alias app.device
 * @class
 * @hideconstructor
 * @example 
 * //Get the device breakpoint and screen size information
 * 
 * {
 *     "mounted": true,
 *     "screen": {
 *         "width": 310,
 *         "height": 590
 *     },
 *     "limits": {
 *         "xs": 600,
 *         "sm": 960,
 *         "md": 1264,
 *         "lg": 1904
 *     },
 *     "breakpoint": {
 *         "mobile": true,
 *         "tablet": false,
 *         "desktop": false,
 *         "xs": true,
 *         "sm": false,
 *         "md": false,
 *         "lg": false,
 *         "xl": false,
 *         "xsOnly": true,
 *         "smOnly": false,
 *         "smAndDown": true,
 *         "smAndUp": false,
 *         "mdOnly": false,
 *         "mdAndDown": true,
 *         "mdAndUp": false,
 *         "lgOnly": false,
 *         "lgAndDown": true,
 *         "lgAndUp": false,
 *         "xlOnly": false,
 *         "point": 0
 *     },
 *     "point": 0
 * }
 */
var device = {};


/**
 * The Fluro App Service
 * @classdesc This service is only available within a website, dashboard or mobile app built in the Fluro Web Builder. It provides helful tools including functions for navigating around your app, accessing native mobile APIs and playback of media content.
 * 
 * @alias app
 * @class
 * @hideconstructor
 */