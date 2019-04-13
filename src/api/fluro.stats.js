import _ from 'lodash';

///////////////////////////////////////////////////

//This is the bucket for each kind of stat
var FluroUserStatStorage = function(Fluro, statName, unique) {

    var service = {}

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
    }

    ///////////////////////////////////////////////////

    service.isStatted = function(id) {
        return _.get(store, `ids['${id}']`);
    }

    ///////////////////////////////////////////////////

    service.isStatting = function(id) {
        return inProgress[id];
    }


    ///////////////////////////////////////////////////

    service.toggle = function(id) {

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

    service.add = function(id) {

        if (unique) {
            throw Error(`Can't use the add() method on a non-unique stat`)
        }

        var url = `/stat/${id}/${statName}`;

        ///////////////////////////

        var promise = Fluro.api.delete(url);
        inProgress[id] = true;

        promise.then(function(res) {
            store.ids[id] = res.data.total;
            inProgress[id] = false;
        }, function() {
            inProgress[id] = false;
        })

        return promise;
    }

    ///////////////////////////////////////////////////

    service.unset = function(id) {

        if (!unique) {
            throw Error(`Can't use the unset() method on a non-unique stat`)
        }

        var url = `/stat/${id}/${statName}?unique=true`;

        ///////////////////////////

        var promise = Fluro.api.delete(url);
        inProgress[id] = true;

        promise.then(function(res) {
            delete store.ids[id];
            inProgress[id] = false;
            console.log('unset() complete')
        }, function() {
            inProgress[id] = false;
            console.log('unset() error')
        })

        return promise;
    }

    ///////////////////////////////////////////////////

    service.set = function(id) {

        if (!unique) {
            throw Error(`Can't use the set() method on a non-unique stat`)
        }

        var url = `/stat/${id}/${statName}?unique=true`;

        ///////////////////////////

        var promise = Fluro.api.post(url);
        inProgress[id] = true;

        promise.then(function(res) {
            store.ids[id] = true;
            inProgress[id] = false;
            console.log('set() complete')

        }, function(err) {

            inProgress[id] = false;

            var errorName = _.get(err, 'response.data.name');

            //If it's just an existing stat complaint
            if(errorName == 'ExistingUniqueStatError') {
                store.ids[id] = true;
                console.log('set() complete')
                //Mark it as statted anyway
            } else {
                console.log('set() error', )
            }

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

        var promise = Fluro.api.get(url);
        // console.log('New Stat Request')
        inflightRequest = promise;

        promise.then(refreshComplete, refreshFailed);
        return promise;
    }

    //////////////////////////////

    function refreshComplete(res) {
        // console.log('Stats updated')
        Object.assign(store, res.data);
        finish();
    }

    function refreshFailed(err) {
        console.log(statName, 'stats could not be retrieved')
        finish();
    }

    function finish() {

        // setTimeout(function() {
            inflightRequest = null;
           
        // }, 500);
    }

    //////////////////////////////
    
    var initPromise = service.refresh();
    initPromise.then(refreshComplete, refreshFailed);
    inflightRequest = initPromise

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
        stores: {},
    }

    ///////////////////////////////////////////////////

    service.refresh = function() {

        var promises = [];

        //Refreshes all the stats
        _.each(service.stores, function(store) {
            promises.push(store.refresh());
        })

        return Promise.all(promises)
    }

    ///////////////////////////////////////////////////

    //Create a new / Get an existing store
    service.getStore = function(statName, unique) {

        

        var key = statName;
        if (unique) {
            key = '_' + key;
        }

        if (service.stores[key]) {
            return service.stores[key];
        }


        service.stores[key] = new FluroUserStatStorage(Fluro, statName, unique);

        return service.stores[key];
    }

    ///////////////////////////////////////////////////

    return service;

}


export default FluroStats;