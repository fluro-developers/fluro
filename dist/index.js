/******/ (function(modules) { // webpackBootstrap
/******/ 	// install a JSONP callback for chunk loading
/******/ 	function webpackJsonpCallback(data) {
/******/ 		var chunkIds = data[0];
/******/ 		var moreModules = data[1];
/******/ 		var executeModules = data[2];
/******/
/******/ 		// add "moreModules" to the modules object,
/******/ 		// then flag all "chunkIds" as loaded and fire callback
/******/ 		var moduleId, chunkId, i = 0, resolves = [];
/******/ 		for(;i < chunkIds.length; i++) {
/******/ 			chunkId = chunkIds[i];
/******/ 			if(installedChunks[chunkId]) {
/******/ 				resolves.push(installedChunks[chunkId][0]);
/******/ 			}
/******/ 			installedChunks[chunkId] = 0;
/******/ 		}
/******/ 		for(moduleId in moreModules) {
/******/ 			if(Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
/******/ 				modules[moduleId] = moreModules[moduleId];
/******/ 			}
/******/ 		}
/******/ 		if(parentJsonpFunction) parentJsonpFunction(data);
/******/
/******/ 		while(resolves.length) {
/******/ 			resolves.shift()();
/******/ 		}
/******/
/******/ 		// add entry modules from loaded chunk to deferred list
/******/ 		deferredModules.push.apply(deferredModules, executeModules || []);
/******/
/******/ 		// run deferred modules when all chunks ready
/******/ 		return checkDeferredModules();
/******/ 	};
/******/ 	function checkDeferredModules() {
/******/ 		var result;
/******/ 		for(var i = 0; i < deferredModules.length; i++) {
/******/ 			var deferredModule = deferredModules[i];
/******/ 			var fulfilled = true;
/******/ 			for(var j = 1; j < deferredModule.length; j++) {
/******/ 				var depId = deferredModule[j];
/******/ 				if(installedChunks[depId] !== 0) fulfilled = false;
/******/ 			}
/******/ 			if(fulfilled) {
/******/ 				deferredModules.splice(i--, 1);
/******/ 				result = __webpack_require__(__webpack_require__.s = deferredModule[0]);
/******/ 			}
/******/ 		}
/******/ 		return result;
/******/ 	}
/******/
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// object to store loaded and loading chunks
/******/ 	// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 	// Promise = chunk loading, 0 = chunk loaded
/******/ 	var installedChunks = {
/******/ 		"main": 0
/******/ 	};
/******/
/******/ 	var deferredModules = [];
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];
/******/ 	var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);
/******/ 	jsonpArray.push = webpackJsonpCallback;
/******/ 	jsonpArray = jsonpArray.slice();
/******/ 	for(var i = 0; i < jsonpArray.length; i++) webpackJsonpCallback(jsonpArray[i]);
/******/ 	var parentJsonpFunction = oldJsonpFunction;
/******/
/******/
/******/ 	// add entry module to deferred list
/******/ 	deferredModules.push(["./src/index.js","vendors~main"]);
/******/ 	// run deferred modules when ready
/******/ 	return checkDeferredModules();
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/api/fluro.api.js":
/*!******************************!*\
  !*** ./src/api/fluro.api.js ***!
  \******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! axios */ \"./node_modules/axios/index.js\");\n/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(axios__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var axios_extensions__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! axios-extensions */ \"./node_modules/axios-extensions/esm/index.js\");\n\n\n\n///////////////////////////////////////\n\n\nvar FluroAPI = function(fluro) {\n\n\t\t///////////////////////////////////////\n\n\tvar service = axios__WEBPACK_IMPORTED_MODULE_0___default.a.create({\n        adapter: Object(axios_extensions__WEBPACK_IMPORTED_MODULE_1__[\"throttleAdapterEnhancer\"])(Object(axios_extensions__WEBPACK_IMPORTED_MODULE_1__[\"cacheAdapterEnhancer\"])(axios__WEBPACK_IMPORTED_MODULE_0___default.a.defaults.adapter))\n    });\n\n\t///////////////////////////////////////\n\n\tservice.defaults.baseURL = fluro.apiURL;\n    service.defaults.headers.common.Accept = 'application/json';\n\n\n    /////////////////////////////////////////////////////\n\n    service.interceptors.response.use(function(response) {\n        return response;\n    }, function(err) {\n\n        //Get the response status\n        var status = err.response.status;\n\n        \n        switch (status) {\n            case 502:\n                // case 503:\n            case 504:\n                //Retry\n                console.log('fluro.api > connection error retrying')\n                return Fluro.api.request(err.config);\n                break;\n            default:\n                //Some other error\n                console.log('fluro.api > connection error', err);\n                break;\n        }\n\n        /////////////////////////////////////////////////////\n        /// \n        return Promise.reject(err);\n    })\n\n\t\n\t///////////////////////////////////////\n\n\treturn service;\n}\n\n\n\n///////////////////////////////////////\n///////////////////////////////////////\n///////////////////////////////////////\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (FluroAPI);\n\n\n//# sourceURL=webpack:///./src/api/fluro.api.js?");

/***/ }),

/***/ "./src/api/fluro.asset.js":
/*!********************************!*\
  !*** ./src/api/fluro.asset.js ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n\n\n\n///////////////////////////////////////////////////\n\nvar FluroAsset = function(Fluro) {\n\n\n    if(!window){\n        window = {\n            screen:{\n                width:1920,\n                height:1080,\n            },\n        }\n    }\n\n    var isRetina = window.devicePixelRatio > 1;\n\n    ///////////////////////////////////////////////////\n\n\n    var service = {};\n\n    ///////////////////////////////////////////////////\n\n    function parameterDefaults(url, params) {\n\n        ////////////////////////////////////\n\n        //If an extension was provided add it to the url\n        if (params.extension && params.extension.length) {\n\n            if(params.title && params.title.length) {\n                \n                url += `/file/${params.title}.${params.extension}`;\n                delete params.title;\n\n            } else {\n                if (params.filename && params.filename.length) {\n                    url += `/file/${params.filename}.${params.extension}`;\n                    delete params.filename;\n                } else {\n                    url += `/file/file.${params.extension}`;\n                }\n            }\n            \n            //Dont need to include it anymore\n            delete params.extension;\n        } else {\n            if (params.filename && params.filename.length) {\n                url += `/file/${params.filename}`;\n                delete params.filename;\n            }\n        }\n\n        ////////////////////////////////////\n\n        //If we haven't requested without token\n        if (!params.withoutToken) {\n            //Get the current token from FluroAuth\n            var CurrentFluroToken = Fluro.auth.getCurrentToken();\n\n            //Check to see if we have a token and none has been explicity set\n            if (!params['access_token'] && CurrentFluroToken) {\n                //Use the current token by default\n                params['access_token'] = CurrentFluroToken;\n            }\n        }\n    }\n\n    ///////////////////////////////////////////////////\n\n    service.getUrl = function(assetID, params) {\n\n        if (!assetID || !String(assetID).length) {\n            return;\n        }\n\n        if(!params) {\n            params = {};\n        }\n\n        var url = `${Fluro.apiURL}/get/${assetID}`;\n\n        ////////////////////////////////////////\n\n        parameterDefaults(url, params);\n\n        ////////////////////////////////////////\n\n        //Map the parameters to a query string\n        var queryParameters = Fluro.utils.mapParameters(params);\n\n        if (queryParameters.length) {\n            url += '?' + queryParameters;\n        }\n\n        return url;\n\n    }\n\n\n\n    ///////////////////////////////////////////////////\n\n    service.avatarUrl = function(personID, style, params) {\n\n        if (!personID || !String(personID).length) {\n            return;\n        }\n\n        if(!params) {\n            params = {};\n        }\n\n        if (!style) {\n            style = 'contact';\n        }\n\n        var url = `${Fluro.apiURL}/get/avatar/${style}/${personID}`;\n\n        ////////////////////////////////////////\n\n        parameterDefaults(url, params);\n\n        ////////////////////////////////////////\n\n        //Map the parameters to a query string\n        var queryParameters = Fluro.utils.mapParameters(params);\n\n        if (queryParameters.length) {\n            url += '?' + queryParameters;\n        }\n\n        return url;\n\n    }\n\n    ///////////////////////////////////////////////////\n\n    //Get the cover image for an event, group or realm\n    service.coverImage = function(contentID, style, params) {\n\n        if (!contentID || !String(contentID).length) {\n            return;\n        }\n\n        if(!params) {\n            params = {};\n        }\n\n        if (!style) {\n            style = 'event';\n        }\n\n        var url = `${Fluro.apiURL}/get/${style}/${contentID}`;\n\n        ////////////////////////////////////////\n\n        parameterDefaults(url, params);\n\n        ////////////////////////////////////////\n\n        //Map the parameters to a query string\n        var queryParameters = Fluro.utils.mapParameters(params);\n\n        if (queryParameters.length) {\n            url += '?' + queryParameters;\n        }\n\n        return url;\n\n    }\n\n\n    ///////////////////////////////////////////////////\n\n    service.downloadUrl = function(assetID, params) {\n\n        if (!assetID || !String(assetID).length) {\n            return;\n        }\n\n        if(!params) {\n            params = {};\n        }\n\n        var url = `${Fluro.apiURL}/download/${assetID}`;\n\n        ////////////////////////////////////////\n\n        parameterDefaults(url, params);\n\n        ////////////////////////////////////////\n\n        //Map the parameters to a query string\n        var queryParameters = Fluro.utils.mapParameters(params);\n\n        if (queryParameters.length) {\n            url += '?' + queryParameters;\n        }\n\n        return url;\n\n    }\n\n\n    ///////////////////////////////////////////////////\n    \n    //Helper function for retrieving the poster image for a video\n    service.posterUrl = function(videoID, w, h, params) {\n        if (!videoID || !String(videoID).length) {\n            return;\n        }\n\n        if(!params) {\n            params = {};\n        }\n\n        //////////////////////////////////////\n\n        var screenWidth = window.screen.width || 1920;\n        var screenHeight = window.screen.width || 1080;\n\n        //////////////////////////////////////\n\n        //Setup our usual width limit\n        var limitWidth;\n\n        //By default, limit the width\n        if (isRetina) {\n            limitWidth = 1920;\n        } else {\n            limitWidth = 1200;\n        }\n\n        //////////////////////////////////////\n\n        //If the screen is smaller then 768 use an optimised image\n        if (screenWidth <= 768) {\n            if (isRetina) {\n                limitWidth = 1536;\n            } else {\n                limitWidth = 768;\n            }\n        }\n\n        //If using mobile then use a smaller optimised image\n        if (screenWidth <= 320) {\n            if (isRetina) {\n                limitWidth = 640;\n            } else {\n                limitWidth = 320;\n            }\n        }\n\n        //////////////////////////////////////////////////\n\n        //If no width or height was specified\n        if (!w && !h) {\n            //Use our default width based on screen size\n            params['w'] = limitWidth;\n            params['h'] = Math.round(limitWidth * (9 /16));\n        } else {\n\n            //If a width was specified\n            if (w) {\n                params['w'] = w;\n\n                if(!h) {\n                    //If no height specified calculate based on aspect ratio\n                    params['h'] = Math.round(w * (9 /16));\n                }\n            }\n\n            //If a height was specified\n            if (h) {\n                params['h'] = h;\n            }\n        }\n        \n        //////////////////////////////////////////////////\n\n\n        //Create the basic url\n        var url = `${Fluro.apiURL}/get/${videoID}/poster`;\n\n        ////////////////////////////////////////\n\n        parameterDefaults(url, params);\n\n        ////////////////////////////////////////\n\n        //Map the parameters to a query string\n        var queryParameters = Fluro.utils.mapParameters(params);\n\n        if (queryParameters.length) {\n            url += '?' + queryParameters;\n        }\n\n        ////////////////////////////////////////\n\n        return url;\n    }\n\n\n    ///////////////////////////////////////////////////\n    \n    //Helper function for retrieving the poster image for a video\n    service.imageUrl = function(imageID, w, h, params) {\n        if (!imageID || !String(imageID).length) {\n            return;\n        }\n\n        if(!params) {\n            params = {};\n        }\n\n        //Create the basic url\n        var url = Fluro.apiURL + '/get/' + imageID;\n\n        //////////////////////////////////////\n\n        //Setup our usual width limit\n        var limitWidth;\n\n        //By default, limit the width\n        if (isRetina) {\n            limitWidth = 1920;\n        } else {\n            limitWidth = 1200;\n        }\n\n        //////////////////////////////////////\n\n        //If the screen is smaller then 768 use an optimised image\n        if ($window.screen.width <= 768) {\n            if (isRetina) {\n                limitWidth = 1536;\n            } else {\n                limitWidth = 768;\n            }\n        }\n\n        //If using mobile then use a smaller optimised image\n        if ($window.screen.width <= 320) {\n            if (isRetina) {\n                limitWidth = 640;\n            } else {\n                limitWidth = 320;\n            }\n        }\n\n        ////////////////////////////////////\n\n        //If no width or height was specified\n        if (!w && !h) {\n            //Use our default limits\n            params['w'] = limitWidth;\n        } else {\n\n            //If a width was specified\n            if (w) {\n                params['w'] = w;\n            }\n\n            //If a height was specified\n            if (h) {\n                params['h'] = h;\n            }\n        }\n\n        ////////////////////////////////////////\n\n        //Default to 90% quality huge compression gains\n        if (!params.quality) {\n            params.quality = 90;\n        }\n\n        ////////////////////////////////////////\n\n        parameterDefaults(url, params);\n\n        ////////////////////////////////////////\n\n        //Map the parameters to a query string\n        var queryParameters = Fluro.utils.mapParameters(params);\n\n        if (queryParameters.length) {\n            url += '?' + queryParameters;\n        }\n\n        ////////////////////////////////////////\n\n        return url;\n    }\n\n    ///////////////////////////////////////////////////\n\n    return service;\n\n}\n\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (FluroAsset);\n\n//# sourceURL=webpack:///./src/api/fluro.asset.js?");

/***/ }),

/***/ "./src/api/fluro.auth.js":
/*!*******************************!*\
  !*** ./src/api/fluro.auth.js ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! axios */ \"./node_modules/axios/index.js\");\n/* harmony import */ var axios__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(axios__WEBPACK_IMPORTED_MODULE_0__);\n\n\n///////////////////////////////////////////////////\n\nvar FluroAuth = function(Fluro) {\n\n    if (!Fluro.api) {\n        throw new Error(`Can't Instantiate FluroAuth before FluroAPI exists`);\n    }\n\n    //Keep track of any refresh requests\n    var inflightRefreshRequest;\n\n    ///////////////////////////////////////////////////\n\n    var defaultStore = {};\n    var store = defaultStore;\n\n    ///////////////////////////////////////////////////\n\n    var service = {}\n\n    ///////////////////////////////////////////////////\n\n    service.set = function(user) {\n        store.user = user;\n        console.log('fluro.auth > user set');\n        if (service.onChange) {\n            service.onChange(store.user);\n        }\n\n\n    }\n\n    ///////////////////////////////////////////////////\n\n    service.logout = function() {\n        //Unauthenticated\n        // delete store.token;\n\n        delete store.user;\n        // delete store.refreshToken;\n        // delete store.expires;\n\n        console.log('fluro.auth > user logout');\n        if (service.onChange) {\n            service.onChange(store.user);\n        }\n        \n    }\n\n    ///////////////////////////////////////////////////\n\n    service.login = function(credentials, options) {\n\n        if (!options) {\n            options = {};\n        }\n\n        //////////////////////////////////////\n\n        var promise = new Promise(loginCheck)\n\n        function loginCheck(resolve, reject) {\n\n            if (!credentials) {\n                return reject({\n                    message: 'Missing credentials!',\n                })\n            }\n\n            if (!credentials.username || !credentials.username.length) {\n                return reject({\n                    message: 'Username was not provided',\n                })\n            }\n\n            if (!credentials.password || !credentials.password.length) {\n                return reject({\n                    message: 'Password was not provided',\n                })\n            }\n\n            /////////////////////////////////////////////\n\n            var url = Fluro.apiURL + '/token/login';\n\n            /////////////////////////////////////////////\n\n            //If we are authenticating as an application\n            if (options.application) {\n\n                //The url is relative to the domain\n                url = '/fluro/application/login';\n            }\n\n\n            /////////////////////////////////////////////\n\n            //If we are logging in to a managed account use a different endpoint\n            if (options.managedAccount) {\n                url = Fluro.apiURL + '/managed/' + options.managedAccount + '/login';\n            }\n\n            //If we have a specified url\n            if (options.url) {\n                url = options.url;\n            }\n\n            /////////////////////////////////////////////\n\n            Fluro.api.post(url, credentials, {\n                bypassInterceptor: true\n            }).then(function(res) {\n                store.user = res.data;\n                if (service.onChange) {\n                    service.onChange(store.user);\n                }\n            }, reject);\n        }\n\n        //////////////////////////////////////\n\n        return promise;\n\n    }\n\n    ///////////////////////////////////////////////////\n\n    service.refreshAccessToken = function(refreshToken) {\n\n        //If there is already a request in progress\n        if (inflightRefreshRequest) {\n            return inflightRefreshRequest;\n        }\n\n        /////////////////////////////////////////////////////\n\n        //Create an refresh request\n        inflightRefreshRequest = new Promise(function(resolve, reject) {\n\n            console.log('fluro.auth > refresh token');\n\n            //Bypass the interceptor on all token refresh calls\n            //Because we don't need to add the access token etc onto it\n            Fluro.api.post('token/refresh', {\n                    refreshToken: refreshToken\n                }, {\n                    bypassInterceptor: true\n                })\n                .then(function tokenRefreshComplete(res) {\n                    //Save the user data\n                    store.user = res.data;\n                    console.log('fluro.auth > token refreshed');\n\n                    if (service.onChange) {\n                        service.onChange(store.user);\n                    }\n\n                    //Resolve with the new token\n                    resolve(res.data.token);\n\n                    //Remove the inflight request\n                    inflightRefreshRequest = null;\n\n                }, reject);\n        });\n\n        //Return the refresh request\n        return inflightRefreshRequest;\n    }\n\n\n    /////////////////////////////////////////////////////\n\n    service.getCurrentToken = function() {\n        return _.get(store, 'user.token') || Fluro.applicationToken;\n    }\n\n    /////////////////////////////////////////////////////\n\n    Fluro.api.interceptors.request.use(function(config) {\n\n        //If we want to bypass the interceptor\n        //then just return the request\n        if (config.bypassInterceptor) {\n            return config;\n        }\n\n        //////////////////////////////\n\n        //Get the original request\n        var originalRequest = config;\n\n        //If we aren't logged in or don't have a token\n        var token = _.get(store, 'user.token');\n        var refreshToken = _.get(store, 'refresh.token');\n\n        //////////////////////////////\n\n        //If there is a user token\n        if (token) {\n\n            //Set the token of the request as the user's access token\n            originalRequest.headers['Authorization'] = 'Bearer ' + token;\n            console.log('fluro.auth > using user token');\n\n        } else if (Fluro.applicationToken && Fluro.applicationToken.length) {\n\n            //If there is a static application token\n            //For example we have logged out from a website\n            //that has public content also\n            originalRequest.headers['Authorization'] = 'Bearer ' + Fluro.applicationToken;\n\n            console.log('fluro.auth > using app token');\n            return originalRequest;\n\n        } else {\n            //Return the original request without a token\n            console.log('fluro.auth > no token');\n            return originalRequest;\n        }\n\n        /////////////////////////////////////////////////////\n\n        //If no refresh token\n        if (!refreshToken) {\n            console.log('fluro.auth > no refresh token');\n            //Continue with the original request\n            return originalRequest;\n        }\n\n        /////////////////////////////////////////////////////\n\n        //We have a refresh token so we need to check\n        //whether our access token is stale and needs to be refreshed\n        var now = new Date();\n        var expiryDate = _.get(store, 'user.expires');\n        var expires = new Date(expiryDate);\n\n        //If the token is still fresh\n        if (now < expires) {\n            //Return the original request\n            return originalRequest;\n        }\n\n        /////////////////////////////////////////////////////\n\n        //The token is stale by this point\n        console.log('fluro.auth > token expired');\n\n        return new Promise(function(resolve, reject) {\n\n            //Refresh the token\n            service.refreshAccessToken(refreshToken)\n                .then(function(newToken) {\n                    console.log('Token refreshed');\n                    //Update the original request with our new token\n                    originalRequest.headers['Authorization'] = 'Bearer ' + newToken;\n                    //And continue onward\n                    return resolve(originalRequest);\n                }, reject);\n        });\n\n\n    }, function(error) {\n        return Promise.reject(error);\n    })\n\n    /////////////////////////////////////////////////////\n\n    Fluro.api.interceptors.response.use(function(response) {\n        return response;\n    }, function(err) {\n\n        //Get the response status\n        var status = err.response.status;\n\n        console.log('fluro.auth > error');\n        switch (status) {\n            case 401:\n\n                service.logout();\n                break;\n            case 502:\n                // case 503:\n            case 504:\n                //Retry\n                console.log('Retry request')\n                return Fluro.api.request(err.config);\n                break;\n            default:\n                //Some other error\n                break;\n        }\n\n        /////////////////////////////////////////////////////\n        /// \n        return Promise.reject(err);\n    })\n\n    return service;\n\n}\n\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (FluroAuth);\n\n//# sourceURL=webpack:///./src/api/fluro.auth.js?");

/***/ }),

/***/ "./src/api/fluro.core.js":
/*!*******************************!*\
  !*** ./src/api/fluro.core.js ***!
  \*******************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _fluro_api__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./fluro.api */ \"./src/api/fluro.api.js\");\n/* harmony import */ var _fluro_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./fluro.auth */ \"./src/api/fluro.auth.js\");\n/* harmony import */ var _fluro_asset__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./fluro.asset */ \"./src/api/fluro.asset.js\");\n/* harmony import */ var _fluro_utils__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./fluro.utils */ \"./src/api/fluro.utils.js\");\n\n\n\n\n\n\n\n///////////////////////////////////////\n\nvar Fluro = function(options) {\n\n\tif(!options) {\n\t\toptions = {\n\t\t\t// apiURL,\n\t\t\t// applicationToken,\n\t\t\t// api:{}\n\t\t};\n\t}\n\n\t///////////////////////////////////////\n\n\tif(!options.apiURL || !options.apiURL.length) {\n\t\toptions.apiURL = 'production';\n\t}\n\n\t///////////////////////////////////////\n\n\tswitch(options.apiURL) {\n\t\tcase 'production':\n\t\t\toptions.apiURL = 'https://api.fluro.io';\n\t\tbreak;\n\t\tcase 'staging':\n\t\t\toptions.apiURL = 'https://api.staging.fluro.io';\n\t\tbreak;\n\t\tcase 'local':\n\t\t\toptions.apiURL = 'http://api.fluro.localhost:3000';\n\t\tbreak;\n\t}\n\n\n\t///////////////////////////////////////\n\n\tvar core = {\n\t\tapiURL:options.apiURL,\n\t}\n\n\t///////////////////////////////////////\n\n\tObject.defineProperty(core, 'api', {\n\t\tvalue:new _fluro_api__WEBPACK_IMPORTED_MODULE_0__[\"default\"](core),\n\t\twritable:false,\n\t});\n\n\tObject.defineProperty(core, 'auth', {\n\t\tvalue:new _fluro_auth__WEBPACK_IMPORTED_MODULE_1__[\"default\"](core),\n\t\twritable:false,\n\t});\n\n\tObject.defineProperty(core, 'asset', {\n\t\tvalue:new _fluro_asset__WEBPACK_IMPORTED_MODULE_2__[\"default\"](core),\n\t\twritable:false,\n\t});\n\n\tObject.defineProperty(core, 'utils', {\n\t\tvalue:_fluro_utils__WEBPACK_IMPORTED_MODULE_3__[\"default\"],\n\t\twritable:false,\n\t});\n\n\t\n\n\t///////////////////////////////////////\n\n\treturn core;\n\n\n\t\n/**\n\t///////////////////////////////////////\n\n\t//Create a new instance of the fluro API\n\tvar _api = new FluroAPI(options.apiURL, options.api);\n\tvar _auth = new FluroAuth(_api, options.applicationToken);\n\tvar _asset = new FluroAsset(_api, _auth);\n\n\t///////////////////////////////////////\n\n\tvar service = {\n\t\tget api() {\n\t\t\treturn _api;\n\t\t},\n\t\tget auth() {\n\t\t\treturn _auth;\n\t\t},\n\t\tget asset() {\n\t\t\treturn _asset;\n\t\t}\n\t}\n\n\t///////////////////////////////////////\n\n\treturn service;\n\t/**/\n}\n\n///////////////////////////////////////\n///////////////////////////////////////\n///////////////////////////////////////\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (Fluro);\n\n\n//# sourceURL=webpack:///./src/api/fluro.core.js?");

/***/ }),

/***/ "./src/api/fluro.utils.js":
/*!********************************!*\
  !*** ./src/api/fluro.utils.js ***!
  \********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ \"./node_modules/lodash/lodash.js\");\n/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);\n\n\n\n\n///////////////////////////////////////////////////////////////////////////////\n\nvar FluroUtils = {};\n\n///////////////////////////////////////////////////////////////////////////////\n\nFluroUtils.mapParameters = function(parameters) {\n\treturn lodash__WEBPACK_IMPORTED_MODULE_0___default.a.map(parameters, function(v, k) {\n        return encodeURIComponent(k) + '=' + encodeURIComponent(v);\n    }).join('&');\n}\n///////////////////////////////////////////////////////////////////////////////\n\nFluroUtils.arrayIDs = function(array, asObjectID) {\n\n    if(!array) {\n        return array;\n    }\n\n    return lodash__WEBPACK_IMPORTED_MODULE_0___default.a.chain(array)\n    .compact()\n    .map(function(input) {\n        return FluroUtils.getStringID(input, asObjectID);\n    })\n    .compact()\n    .uniq()\n    .value();\n\n}\n\n\n\n///////////////////////////////////////////////////////////////////////////////\n\n//Helper function to get an id of an object\nFluroUtils.getStringID = function(input, asObjectID) {\n\n    if(!input) {\n        return input;\n    }\n\n    /////////////////////////////////\n\n    var output;\n\n    if(input._id) {\n        output = String(input._id);\n    } else {\n        output = String(input);\n    }\n    \n    if(!asObjectID) {\n        return output;\n    }\n\n    return output;\n    // var mongoose = require('mongoose');\n    // var ObjectId = mongoose.Types.ObjectId;\n\n    // var isValid = ObjectId.isValid(String(output));\n    // if(!isValid) {\n        // return;\n    // }\n\n    // return new ObjectId(output);\n\n}\n\n\n\n\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (FluroUtils);\n\n//# sourceURL=webpack:///./src/api/fluro.utils.js?");

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _api_fluro_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./api/fluro.core */ \"./src/api/fluro.core.js\");\n\n\n\n\n\n/* harmony default export */ __webpack_exports__[\"default\"] = (_api_fluro_core__WEBPACK_IMPORTED_MODULE_0__[\"default\"]);\n\n\n//# sourceURL=webpack:///./src/index.js?");

/***/ })

/******/ });