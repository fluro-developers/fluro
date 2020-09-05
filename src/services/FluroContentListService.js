import { EventDispatcher } from '../api/fluro.utils';


const FluroContentListService = function(typeName, fluro, options) {


    ////////////////////////////////////

    if (!options) {
        options = {};
    }

    var pageOptions = {};

    ////////////////////////////////////

    if (!options.pageIndex) {
        options.pageIndex = 0;
    }

    if (!options.perPage) {
        options.perPage = 25;
    }

    ////////////////////////////////////

    var _type = typeName;
    var _criteria = options.criteria || {};
    var _pageIndex = Math.max(options.pageIndex, 0);
    var _perPage = Math.min(options.perPage, 200);
    var _loadingFilter = false;
    var _loadingPage = false;
    var _items = [];
    var _page = [];
    var _cacheKey = options.cacheKey;

    var service = {};

    ////////////////////////////////////

    //Create a new dispatcher
    var dispatcher = new EventDispatcher();
    dispatcher.bootstrap(service);

    ////////////////////////////////////

    //Get our list cache
    var listCache = fluro.cache.get('listcache');
    var pageCache = fluro.cache.get('pagecache');

    ////////////////////////////////////

    service.filter = function() {

        _loadingFilter = true;


        return new Promise(function(resolve, reject) {

            //Generate a unique cache key for this function call
            var cacheString = `${_type}-${JSON.stringify(_criteria)}-${_cacheKey || 'none'}`;
            var cachedFilterResults = listCache.get(cacheString);

            ////////////////////////////////

            if (cachedFilterResults) {
                _items = cachedFilterResults;
                resolve(cachedFilterResults);
                _loadingFilter = false;
                // console.log('ListService > FROM CACHE', cachedFilterResults)
            } else {

                // console.log('ListService > Load Filter');
                fluro.content.filter(_type, _criteria)
                    .then(function(filtered) {

                        _items = filtered;
                        dispatcher.dispatch('items', _items);

                        //Save our results to the cache
                        var cachedFilterResults = filtered;
                        listCache.set(cacheString, cachedFilterResults);

                        //Populate the pageIndex items
                        resolve(cachedFilterResults);
                        _loadingFilter = false;
                        dispatcher.dispatch('loadingFilter', _loadingFilter);

                    })
                    .catch(function(err) {
                        reject(err);
                        _loadingFilter = false;
                        dispatcher.dispatch('loadingFilter', _loadingFilter);
                        dispatcher.dispatch('error', err);
                    });
            }
        })
    }

    //100 items
    //Page 0
    //Should be 0 - 25

    //Page 1
    //should be 26 - 50;
    //Start 

    ////////////////////////////////////

    service.reloadCurrentPage = function() {


        var start = Math.floor(_perPage * _pageIndex);
        var end = start + _perPage;

        ////////////////////////////////////////

        _loadingPage = true;



        return new Promise(function(resolve, reject) {

            service.filter()
                .then(function(filtered) {

                    var listItems = filtered.slice(start, end);
                    var ids = fluro.utils.arrayIDs(listItems);

                    ///////////////////////////////////

                    dispatcher.dispatch('totalPages', service.totalPages);
                   

                    ///////////////////////////////////

                    var pageCacheKey = `${ids.join(',')}-${_cacheKey || 'none'}`;
                    var cachedPageResults = pageCache.get(pageCacheKey);

                    if (cachedPageResults) {
                        return pageComplete(cachedPageResults)
                    }


                    fluro.content.getMultiple(_type, ids, pageOptions)
                        .then(pageComplete)
                        .catch(function(err) {
                            reject(err)
                            _loadingPage = false;
                            dispatcher.dispatch('loadingPage', _loadingPage);
                        })

                    ///////////////////////////////////

                    function pageComplete(items) {

                        //Save our results to the cache
                        pageCache.set(pageCacheKey, items);
                        _page = items;
                        resolve(items)
                        _loadingPage = false;
                        dispatcher.dispatch('loadingPage', _loadingPage);
                        dispatcher.dispatch('page', _page);
                    }
                    ///////////////////////////////////


                })
        })
    }

    /////////////////////////////

    service.nextPage = function() {
        service.pageIndex++;
    }

    service.previousPage = function() {
        service.pageIndex--;
    }


    // /////////////////////////////

    // Object.defineProperty(service, "nextPageEnabled", {
    //     get() {
    //         return service.pageIndex < Math.ceil(_items.length / _perPage) - 1;
    //     }
    // });

    // Object.defineProperty(service, "previousPageEnabled", {
    //     get() {
    //         return service.pageIndex > 0;
    //     }
    // });

    /////////////////////////////



    Object.defineProperty(service, "loading", {
        get() {
            return _loadingFilter || _loadingPage;
        }
    });


    Object.defineProperty(service, "perPage", {
        get() {
            return _perPage;
        },
        set(i) {
            if (!i) {
                i = 25;
            }

            i = Math.min(i, 200);
            i = Math.max(i, 0);

            _perPage = i;
            service.reloadCurrentPage();
        }
    });

    /////////////////////////////

    Object.defineProperty(service, "cacheKey", {
        get() {
            return _cacheKey;
        },
        set(c) {
            _cacheKey = c;
            service.reloadCurrentPage();
        }
    });

    /////////////////////////////

    Object.defineProperty(service, "pageIndex", {
        get() {
            return _pageIndex;
        },
        set(i) {

            var previousIndex = _pageIndex;
            if (!i) {
                i = 0;
            }


            var maxPages = Math.ceil(_items.length / _perPage);
            i = Math.min(i, maxPages - 1);
            i = Math.max(i, 0);
            _pageIndex = i;
            dispatcher.dispatch('pageIndex', _pageIndex);
            service.reloadCurrentPage();
        }
    });

    /////////////////////////////

    Object.defineProperty(service, "items", {
        get() {
            return _items;
        },
    });

    Object.defineProperty(service, "page", {
        get() {
            return _page;
        },
    });

    /////////////////////////////

    Object.defineProperty(service, "totalPages", {
        get() {
            return Math.ceil(_items.length / _perPage);
        },
    });


    /////////////////////////////

    Object.defineProperty(service, "total", {
        get() {
            return _items.length;
        },
    });


    /////////////////////////////

    Object.defineProperty(service, "criteria", {
        get() {
            return _criteria;
        },
        set(obj) {
            _criteria = obj;
            service.reloadCurrentPage();
        }
    });


    /////////////////////////////

    Object.defineProperty(service, "type", {
        get() {
            return _type;
        },
        set(type) {
            _type = type;
            service.reloadCurrentPage();
        }
    });

    /////////////////////////////

    service.reloadCurrentPage();

    /////////////////////////////

    return service;

}


export default FluroContentListService;