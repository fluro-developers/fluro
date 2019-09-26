import _ from 'lodash';
import { EventDispatcher } from './fluro.utils';


///////////////////////////////////////////////////

//This is the bucket for each kind of stat
var FluroUserStatStorage = function(Fluro, statName, unique) {

    var service = {}


    //Create a new dispatcher
    var dispatcher = new EventDispatcher();
    dispatcher.bootstrap(service);

    //////////////////////////////

    var key = statName;
    if (unique) {
        key = '_' + key;
    }

    //////////////////////////////

    var store = {
        key: key,
        name: statName,
        ids: {}
    }

    var inProgress = {};

    //////////////////////////////

    service.dispatch = function() {
        if (service.onChange) {
            service.onChange(store);
        }

        dispatcher.dispatch('change', store);
    }

    ///////////////////////////////////////////////////

    service.isStatted = function(id) {

        id = Fluro.utils.getStringID(id);
        return _.get(store, `ids['${id}']`);
    }

    ///////////////////////////////////////////////////

    service.isStatting = function(id) {
        id = Fluro.utils.getStringID(id);
        return inProgress[id];
    }


    ///////////////////////////////////////////////////

    ///////////////////////////////////////////////////

    service.toggle = function(id) {
        id = Fluro.utils.getStringID(id);

        if (!unique) {
            throw Error(`Can't use the toggle() method on a non-unique stat`)
        }

        var statted = service.isStatted(id);
        if (statted) {
            return service.unset(id);
        } else {
            return service.set(id);
        }

    }

    ///////////////////////////////////////////////////

    //Set the value and dispatch an event that we are processing
    service.setProcessing = function(id, isProcessing) {
        id = Fluro.utils.getStringID(id);
        inProgress[id] = isProcessing;
        dispatcher.dispatch('statting', { id: id, statting: isProcessing });
    }

    ///////////////////////////////////////////////////

    service.add = function(id) {


        if (unique) {
            throw Error(`Can't use the add() method on a non-unique stat`)
        }

        id = Fluro.utils.getStringID(id);
        var url = `/stat/${id}/${statName}`;

        ///////////////////////////

        var promise = Fluro.api.delete(url);
        service.setProcessing(id, true);

        ///////////////////////////

        promise.then(function(res) {
            store.ids[id] = res.data.total;

            //Tell the world that we are processing
            //a specific stat on an item
            service.setProcessing(id, false);

            //Tell the world that our stats have changed
            dispatcher.dispatch('change', store);


        }, function() {
            service.setProcessing(id, false);
        })

        return promise;
    }

    ///////////////////////////////////////////////////

    service.unset = function(id) {

        if (!unique) {
            throw Error(`Can't use the unset() method on a non-unique stat`)
        }

        id = Fluro.utils.getStringID(id);
        var url = `/stat/${id}/${statName}?unique=true`;

        ///////////////////////////

        var promise = Fluro.api.delete(url);
        service.setProcessing(id, true);

        ///////////////////////////

        promise.then(function(res) {
            delete store.ids[id];

            service.setProcessing(id, false);

            //Broadcast the change in stats
            dispatcher.dispatch('change', store);
        }, function() {
            service.setProcessing(id, false);
        })

        return promise;
    }

    ///////////////////////////////////////////////////

    service.set = function(id) {

        if (!unique) {
            throw Error(`Can't use the set() method on a non-unique stat`)
        }

        id = Fluro.utils.getStringID(id);
        var url = `/stat/${id}/${statName}?unique=true`;

        ///////////////////////////

        var promise = Fluro.api.post(url);
        service.setProcessing(id, true);

        promise.then(function(res) {
            store.ids[id] = true;

            service.setProcessing(id, false);
            dispatcher.dispatch('change', store);

        }, function(err) {

            service.setProcessing(id, false);

            var errorName = _.get(err, 'response.data.name');

            //If it's just an existing stat complaint
            if (errorName == 'ExistingUniqueStatError') {
                store.ids[id] = true;
                //Mark it as statted anyway
            } else {
                // //console.log('set() error', )
            }

            dispatcher.dispatch('change', store);
        })

        return promise;
    }

    //////////////////////////////

    //Create the getters
    Object.defineProperty(service, 'key', {
        value: key,
        writable: false
    });

    //Create the getters
    Object.defineProperty(service, 'name', {
        value: statName,
        writable: false
    });

    //Create the getters
    Object.defineProperty(service, 'ids', {
        value: store.ids,
        writable: false
    });


    //Create the getters
    Object.defineProperty(service, 'pending', {
        value: inProgress,
        writable: false
    });

    //////////////////////////////

    var inflightRequest;

    service.refresh = function() {

        if (inflightRequest) {
            return inflightRequest;
        }

        var url = `/stat/my/${statName}`;

        if (unique) {
            url += '?unique=true';
        }

        ////////////////////////////////

        var promise;

        //If we are not logged in

        var loggedInUser = Fluro.auth.getCurrentUser();

        if (loggedInUser) {
            promise = Fluro.api.get(url);
        } else {
            promise = new Promise(function(resolve) {
                return resolve([]);
            })
        }

        inflightRequest = promise;

        promise.then(refreshComplete, refreshFailed);
        return promise;
    }

    //////////////////////////////

    function refreshComplete(res) {
        Object.assign(store, res.data);
        finish();
    }

    function refreshFailed(err) {
        finish();
    }

    function finish() {



        //Kill the inflight request
        inflightRequest = null;

        //Dispatch event
        dispatcher.dispatch('change', store);
    }

    //////////////////////////////

    inflightRequest = service.refresh().then(refreshComplete, refreshFailed);

    //////////////////////////////

    return service;
}



///////////////////////////////////////////////////

//This is the bucket for each kind of global stat
var FluroStatStorage = function(Fluro, statName, targetID, unique) {

    var service = {
        total: 0,
    }

    //Create a new dispatcher
    var dispatcher = new EventDispatcher();
    dispatcher.bootstrap(service);

    //////////////////////////////

    var key = statName;
    if (unique) {
        key = '_' + key;
    }

    //////////////////////////////

    var store = {
        key: key,
        name: statName,
    }

    //////////////////////////////

    //Create the getters
    Object.defineProperty(service, 'key', {
        value: key,
        writable: false
    });

    //Create the getters
    Object.defineProperty(service, 'name', {
        value: statName,
        writable: false
    });

    //////////////////////////////

    var inflightRequest;

    service.refresh = function() {

        if (inflightRequest) {
            return inflightRequest;
        }


        var url = `/stat/${targetID}/${statName}`;

        if (unique) {
            url += '?unique=true';
        }

        ////////////////////////////////


        var loggedInUser = Fluro.auth.getCurrentUser();

        //If we are logged in as a user or an application
        if (loggedInUser || Fluro.applicationToken) {
            inflightRequest = Fluro.api.get(url, { cache: false });
        } else {
            inflightRequest = new Promise(function(resolve) {
                return resolve([]);
            })
        }

        service.processing = true;
        inflightRequest.then(refreshComplete, refreshFailed);


        return inflightRequest;
    }

    //////////////////////////////

    function refreshComplete(res) {



        var total = _.get(res, 'data.total');

        store.total = service.total = total;

        //console.log(total)
        finish();
    }

    function refreshFailed(err) {
        finish();
    }

    function finish() {
        service.processing = false;

        //Dispatch event
        //console.log('UPDATED WITH NEW STATS', store.total);

        dispatcher.dispatch('change', store);

        //Kill the inflight request
        inflightRequest = null;
    }

    //////////////////////////////

    inflightRequest = service.refresh().then(refreshComplete, refreshFailed);

    //////////////////////////////

    return service;
}


///////////////////////////////////////////////////

//This is the main service that creates the buckets and manages them all
var FluroStats = function(Fluro) {

    if (!Fluro.api) {
        throw new Error(`Can't Instantiate FluroStats before FluroAPI exists`);
    }

    ///////////////////////////////////////////////////

    var service = {
        userStores: {},
        globalStores: {},
    }


    ///////////////////////////////////////////////////

    //Helper function to quickly set a stat
    service.set = function(statName, target) {

        var targetID = Fluro.utils.getStringID(target);

        //Get/Create the stat storage bucket
        var store = service.getUserStore(statName, true);
        store.set(targetID)
    }

    ///////////////////////////////////////////////////

    //Helper function to quickly unset a stat
    service.unset = function(statName, target) {

        var targetID = Fluro.utils.getStringID(target);

        //Get/Create the stat storage bucket
        var store = service.getUserStore(statName, true);
        store.unset(targetID)
    }


    


    ///////////////////////////////////////////////////

    service.refresh = function() {

        var promises = [];

        //Refreshes all the stats
        _.each(service.userStores, function(store) {
            promises.push(store.refresh());
        })

        //Refreshes all the stats
        _.each(service.globalStores, function(store) {
            promises.push(store.refresh());
        })


        return Promise.all(promises)
    }

    ///////////////////////////////////////////////////

    service.getGlobalStoresForKey = function(key) {

        return _.filter(service.globalStores, function(store) {
            return store.key == key;
        })
    }

    ///////////////////////////////////////////////////

    //Create a new / Get an existing store
    service.getUserStore = function(statName, unique) {
        if (!statName) {
            //console.log('No stat name provided');
            return;
        }


        var key = statName;
        if (unique) {
            key = '_' + key;
        }

        if (service.userStores[key]) {
            return service.userStores[key];
        }

        var userStore = new FluroUserStatStorage(Fluro, statName, unique);

        //If the user changes a stat, check if we need to
        userStore.addEventListener('change', function(data) {




            //If there is an existing store for this state
            //we should refresh it cos there's new data
            var staleStores = service.getGlobalStoresForKey(data.key);

            setTimeout(function() {

                //Give the backend a break before we refresh
                _.each(staleStores, function(store) {
                    store.refresh();
                });

            }, 1000);

        });


        service.userStores[key] = userStore;



        return service.userStores[key];
    }


    ///////////////////////////////////////////////////

    //Create a new / Get a global Store
    service.getStore = function(statName, targetID, unique) {
        if (!statName) {
            //console.log('No stat name provided');
            return;
        }




        var key = statName;
        if (unique) {
            key = '_' + key;
        }

        //////////////////////////////////

        //Create a unique key for this specific
        //target and stat
        var combinedKey = `${key}.${targetID}`;

        //////////////////////////////////

        if (service.globalStores[combinedKey]) {
            return service.globalStores[combinedKey];
        }

        //////////////////////////////////

        service.globalStores[combinedKey] = new FluroStatStorage(Fluro, statName, targetID, unique);

        //////////////////////////////////

        return service.globalStores[combinedKey];
    }

    ///////////////////////////////////////////////////

    return service;

}


export default FluroStats;