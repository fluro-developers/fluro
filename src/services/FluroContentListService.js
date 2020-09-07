import { EventDispatcher } from '../api/fluro.utils';


const FluroContentListService = function(typeName, fluro, options) {


    ////////////////////////////////////

    if (!options) {
        options = {};
    }





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
    var _fields = options.fields || [];
    var _items = [];
    var _page = [];
    var _cacheKey = options.cacheKey;
    var _pages = [];
    var _cumulative = options.cumulative;

    ////////////////////////////////////

    ////////////////////////////////////

    var service = {};

    ////////////////////////////////////

    //Create a new dispatcher
    var dispatcher = new EventDispatcher();
    dispatcher.bootstrap(service);

    ////////////////////////////////////

    //Get our list cache
    var listCache = fluro.cache.get('listcache');
    var pageCache = fluro.cache.get('pagecache');

    var cumulative = fluro.cache.get(`cumulativecache`);

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
                // //console.log('ListService > FROM CACHE', cachedFilterResults)
            } else {

                // //console.log('ListService > Load Filter');
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

    ////////////////////////////////////

    service.reloadCurrentPage = function() {


        var start = Math.floor(_perPage * _pageIndex);
        var end = start + _perPage;

        ////////////////////////////////////////

        var itemCachePrefix = `${_fields.join(',')}-${_cacheKey || 'none'}`;

        ////////////////////////////////////////

        _loadingPage = true;

        return new Promise(function(resolve, reject) {

            service.filter()
                .then(function(filtered) {

                    var startingIndex = _cumulative ? 0 : start;
                    //console.log('load', startingIndex, start, end);

                    ///////////////////////////////////

                    var listItems = filtered.slice(startingIndex, end);

                    ///////////////////////////////////

                    //Create a fast hash
                    var pageItemLookup = _.reduce(listItems, function(set, item) {
                        set[item._id] = item;
                        return set;
                    }, {})

                    ///////////////////////////////////

                    //Find the IDs we need to load
                    var ids = [];

                    if (_cumulative) {


                        //Only load the items that we need to
                        var cachedItems = _.map(listItems, function(item) {
                            var id = item._id;
                            var itemCacheKey = `${itemCachePrefix}-${item._id}`;
                            var cachedItem = cumulative.get(itemCacheKey);

                            if (!cachedItem) {
                                ids.push(id);
                            }
                            return cachedItem;

                        });

                        //If we already have all the items cached
                        if (!ids.length) {
                            // //console.log('Cumulative - already have all ids', cachedItems)
                            //Skip ahead because we don't need to load them from the server
                            return pageComplete(cachedItems);
                        } else {
                            // //console.log('Cumulative - retrieve ids', ids);
                        }
                    } else {
                        ids = fluro.utils.arrayIDs(listItems);
                    }

                    ///////////////////////////////////

                    dispatcher.dispatch('totalPages', service.totalPages);

                    ///////////////////////////////////

                    //Get our page cache
                    var pageCacheKey = `${ids.join(',')}-${_fields.join(',')}-${_cacheKey || 'none'}`;
                    var cachedPageResults = pageCache.get(pageCacheKey);

                    //If we already have this page cached
                    if (cachedPageResults) {
                        //Skip ahead
                        // //console.log('Cumulative - Cached Page results', cachedPageResults);
                        return pageComplete(cachedPageResults)
                    }

                    ///////////////////////////////////

                    //Make a request to the server to load the bits we need
                    return fluro.content.getMultiple(_type, ids, {
                            select: _fields,
                        })
                        .then(multipleResultsLoaded)
                        .catch(function(err) {
                            reject(err)
                            _loadingPage = false;
                            dispatcher.dispatch('loadingPage', _loadingPage);
                        })

                    ///////////////////////////////////

                    function multipleResultsLoaded(pageItems) {

                        //If we have loaded some items
                        if (_cumulative) {


                            //We need to compile the items we already cached mixed with the results 
                            //we just loaded from the server
                            var combinedCacheItems = _.map(listItems, function(item) {
                                var itemCacheKey = `${itemCachePrefix}-${item._id}`;
                                return pageItemLookup[item._id] || cumulative.get(itemCacheKey);
                            })

                            // //console.log('Cumulative - Multiple Results', pageItems, combinedCacheItems);
                            return pageComplete(combinedCacheItems);
                        } else {
                            return pageComplete(pageItems);
                        }
                    }

                    ///////////////////////////////////

                    function pageComplete(pageItems) {


                        //Augment our existing filter list with our populated data
                        var items = _.map(pageItems, function(item) {

                            //Augment the original filtered item with the populated item
                            var augmented = Object.assign({}, pageItemLookup[item._id], item);

                            //Store in cache for later
                            var itemCacheKey = `${itemCachePrefix}-${item._id}`;
                            cumulative.set(itemCacheKey, item);

                            return augmented;
                        })

                        if (_cumulative) {
                            //console.log('Cumulative - Page Complete', items);
                        }
                        ///////////////////////////////////

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

            //Reset the page in case we are too far ahead
            service.pageIndex = service.pageIndex;
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

    Object.defineProperty(service, "select", {
        get() {
            return _fields;
        },
        set(array) {
            _fields = array;
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

    Object.defineProperty(service, "cumulative", {
        get() {
            return _cumulative;
        },
        set(cumulative) {
            _cumulative = cumulative;
            service.reloadCurrentPage();
        }
    });

    /////////////////////////////

    service.reloadCurrentPage();

    /////////////////////////////

    return service;

}


export default FluroContentListService;