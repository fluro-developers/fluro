import { EventDispatcher } from '../api/fluro.utils';
import _ from 'lodash';

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

    // //Default all definitions to true
    // var _allDefinitions = options.allDefinitions === false ? false : true;

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

    var cumulativeCache = fluro.cache.get(`cumulativecache`);

    ////////////////////////////////////

    service.filter = function() {

        // ////console.log('REFILTER', _cacheKey)
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
                ////////console.log('ListService > FROM CACHE', cachedFilterResults)
            } else {
                ////////////console.log('ListService > Load Filter');
                fluro.content.filter(_type, _criteria)
                    .then(function(filtered) {

                        ////////console.log('ListService > NOT FROM CACHE', filtered)

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

        // ////console.log('reload current page')
        var start = Math.floor(_perPage * _pageIndex);
        var end = start + _perPage;

        ////////////////////////////////////////

        var itemCachePrefix = `${_fields.join(',')}-${_cacheKey || 'none'}`;

        ////////console.log('item cache prefix', itemCachePrefix);
        ////////////////////////////////////////

        _loadingPage = true;

        return new Promise(function(resolve, reject) {

            service.filter()
                .then(function(filtered) {

                    var startingIndex = _cumulative ? 0 : start;
                    //////console.log('cumulative test', startingIndex, start, end);

                    ///////////////////////////////////

                    var listItems = filtered.slice(startingIndex, end);

                    ///////////////////////////////////

                    //Create a fast hash
                    var pageItemLookup = listItems.reduce(function(set, item) {
                        set[item._id] = item;
                        return set;
                    }, {})

                    ///////////////////////////////////

                    //Find the IDs we need to load
                    var ids = [];

                    if (_cumulative) {

                        //Only load the items that we need to
                        var cachedItems = _.map(listItems, function(item) {

                            var itemCacheKey = `${itemCachePrefix}-${item._id}`;
                            var cachedItem = cumulativeCache.get(itemCacheKey);
                            if (!cachedItem) {
                                ids.push(item._id);
                            }

                            return cachedItem;
                        });

                        //If we already have all the items cached
                        if (!ids.length) {
                            ////////console.log('Cumulative - already have all ids', cachedItems)
                            //Skip ahead because we don't need to load them from the server
                            //////console.log('Page complete empty ids')
                            return pageComplete(cachedItems);
                        } else {
                            ////////console.log('Cumulative - retrieve ids', ids);
                        }
                    } else {
                        ids = fluro.utils.arrayIDs(listItems);
                    }

                    ///////////////////////////////////

                    dispatcher.dispatch('totalPages', service.totalPages);

                    ///////////////////////////////////

                    //Get our page cache
                    var pageCacheKey = `${_cumulative}-${ids.join(',')}-${_fields.join(',')}-${_cacheKey || 'none'}`;
                    var cachedPageResults = pageCache.get(pageCacheKey);


                    //If we already have this page cached
                    if (cachedPageResults) {
                        //Skip ahead
                        //console.log('Cached Page results', _cumulative, cachedPageResults);
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

                         //////console.log('Multiple Results loaded', ids, pageItems)
                        var lookup = pageItems.reduce(function(set, item) {
                            set[item._id] = item;
                            return set;
                        }, {});


                        //If we have loaded some items
                        if (_cumulative) {

                            //We need to compile the items we already cached mixed with the results 
                            //we just loaded from the server
                            var combinedCacheItems = listItems.map(function(item) {

                                var itemCacheKey = `${itemCachePrefix}-${item._id}`;

                                var cachedEntry = cumulativeCache.get(itemCacheKey);
                                if (cachedEntry) {
                                    ////////console.log('CACHED ENTRY', itemCacheKey, cachedEntry);
                                    return cachedEntry;
                                } else {

                                    return lookup[item._id];
                                }

                            })

                            ////////console.log('Cumulative - Multiple Results', pageItems, combinedCacheItems);
                            return pageComplete(combinedCacheItems);
                        } else {
                            return pageComplete(pageItems);
                        }
                    }

                    ///////////////////////////////////

                    function pageComplete(pageItems) {
                        

                        //Augment our existing filter list with our populated data
                        var items = pageItems.map(function(item) {

                            //Augment the original filtered item with the populated item
                            var augmented = Object.assign({}, pageItemLookup[item._id], item);

                            //Store in cache for later
                            var itemCacheKey = `${itemCachePrefix}-${item._id}`;
                            if (!cumulativeCache.get(itemCacheKey)) {
                                ////////console.log('set in cache', itemCacheKey, augmented, '>>', pageItemLookup[item._id], item);
                                cumulativeCache.set(itemCacheKey, augmented);
                            }


                            return augmented;
                        })


                        //////console.log('PAGE COMPLETE - First', _.get(pageItems, '[0].title'), '-', _.get(items, '[0].title'));//, items)
                       
                        //Save the page to our cache
                        pageCache.set(pageCacheKey, items);

                        ///////////////////////////////////

                        //Save our results to the cache

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

            //If there is no change
            if(_perPage == i) {

                return;
            }

            _perPage = i;

            //Reset the page in case we are too far ahead
            service.pageIndex = 0;//service.pageIndex;
            dispatcher.dispatch('perPage', _perPage);
            dispatcher.dispatch('totalPages', service.totalPages);
            
            service.reloadCurrentPage();
        }
    });

    /////////////////////////////

    Object.defineProperty(service, "cacheKey", {
        get() {
            return _cacheKey;
        },
        set(c) {

            //If there is no change
            if(_cacheKey == c) {
                return;
            }


            _cacheKey = c;
            // ////console.log('CACHE KEY HAS CHANGED')
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


            //If there is no change
            if(_pageIndex == i) {
                return;
            }


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

            //If there is no change
            if(JSON.stringify(_criteria) == JSON.stringify(obj)) {
                return;
            }


            _criteria = obj;
            // ////console.log('criteria changed');
            service.reloadCurrentPage();
        }
    });

    /////////////////////////////

    Object.defineProperty(service, "fields", {
        get() {
            return _fields;
        },
        set(array) {

            //If there is no change
            if(JSON.stringify(_fields) == JSON.stringify(array)) {
                return;
            }


            _fields = array;
            // ////console.log('fields changed');

            service.reloadCurrentPage();
        }
    });


    /////////////////////////////

    // Object.defineProperty(service, "allDefinitions", {
    //     get() {
    //         return _allDefinitions;
    //     },
    //     set(boolean) {

          
    //         _allDefinitions = boolean;
    //         // ////console.log('fields changed');

    //         service.reloadCurrentPage();
    //     }
    // });

    /////////////////////////////

    Object.defineProperty(service, "type", {
        get() {
            return _type;
        },
        set(type) {

            //If there is no change
            if(_type == type) {
                return;
            }


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

            //If there is no change
            if(_cumulative == cumulative) {
                return;
            }


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