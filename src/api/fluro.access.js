import _ from 'lodash';
import { EventDispatcher } from './fluro.utils';


///////////////////////////////////////////////////////////////////////////////

/**
 * Creates a new FluroAccess service
 * This module provides helpful functions and tools for managing and understanding a user's permissions and access control
 * 
 * @constructor
 * @param {FluroCore} fluro A reference to the parent instance of the FluroCore module. This module is usually created by a FluroCore instance that passes itself in as the first argument.
 */
var FluroAccess = function(FluroCore) {


    if (!FluroCore.auth) {
        throw new Error(`Can't Instantiate FluroAccess before FluroAccess has been initialized`);
    }

    //////////////////////////////////

    var store = {};
    var service = {};

    //Create a new dispatcher
    var dispatcher = new EventDispatcher();
    dispatcher.bootstrap(service);


    ///////////////////////////////////////////////////

    /**
     * 
     * Sets the default application so that if the current user is running
     * in the context of an application and not an authenticated user this
     * service can still understand and respond according to the permission sets of the 
     * application itself
     * @alias FluroAccess.setDefaultApplication
     * @param  {Object} application The application session data, usually available before this service is initialized
     * @example
     * FluroAccess.setDefaultApplication(window.applicationData._application)
     */

    service.setDefaultApplication = function(application) {
        store.application = application;
        //Dispatch an event that the application data changed
        dispatcher.dispatch('application', application);
    }

    //////////////////////////////////

    service.isFluroAdmin = function() {
        var user = FluroCore.auth.getCurrentUser();

        //If we are not authenticated as a user
        if (!user) {
            return;
        }

        //If we are not an administrator
        if (user.accountType != 'administrator') {
            return;
        }

        //If we are pretending to be someone else
        //or impersonating a persona
        if (user.pretender) {
            return;
        }

        //We are a fluro admin
        return true;
    }

    //////////////////////////////////

    /**
     * Returns either the currently logged in user, or the acting application
     * @alias FluroAccess.retrieveCurrentSession
     * @return {Object} The user or application session that is currently active
     */
    service.retrieveCurrentSession = function() {

        var user = FluroCore.auth.getCurrentUser();
        var application = store.application;

        if (user) {
            return user;
        }

        if (application) {
            return application;
        }

        return
    }

    //////////////////////////////////

    /**
     * Checks whether a user has permission to perform a specified action for a specified type of content
     * If no user is set but an application is then it will return according to the permissions of the application
     * This function is syncronous and returns a basic true or false boolean
     * @param  {String} action     The action to check permissions for eg. 'create', 'view any', 'edit own', 'delete any' etc
     * @param  {String} type       The type or definition name eg. 'photo', 'article', 'team'
     * @param  {String} parentType The basic type, for instance if the type you are checking is 'photo' the parent type would be 'image' so that
     * you can get an accurate return value if the user has permission to perform the action on all definitions of an 'image' type content item 
     * @return {Boolean}            true or false depending on whether the user has the required permissions
     * @alias FluroAccess.can  
     * @example
     *
     * fluro.access.can('create' 'photo', 'image');
     * fluro.access.can('edit any' 'service', 'event');
     * 
     */
    service.can = function(action, type, parentType) {

        //Get the current session
        var session = service.retrieveCurrentSession();

        //If we are not logged in and are not
        //running as an application then we can't
        //do anything
        if (!session) {
            return false;
        }

        //If we are an administrator
        //then we have access to do everything
        //so there is no point continuing with checking all the other criteria
        if (service.isFluroAdmin()) {
            return true;
        }

        /////////////////////////////////////////////////////

        //Get the permission string we actually want to check against
        var permissionString = `${action} ${type}`;

        /////////////////////////////////////////////////////

        //Track the realms we are allowed to do this in
        var realms = [];

        /////////////////////////////////////////////////////

        //Check if we can do this permission in any realms
        switch (action) {
            case 'view any':
                var canViewAnyRealms = service.retrieveActionableRealms('view any ' + type);
                var canEditAnyRealms = service.retrieveActionableRealms('edit any ' + type);

                //Combine the realms
                realms = realms.concat(canViewAnyRealms);
                realms = realms.concat(canEditAnyRealms);
                break;
            case 'view own':
                var canViewOwnRealms = service.retrieveActionableRealms('view own ' + type);
                var canEditOwnRealms = service.retrieveActionableRealms('edit own ' + type);

                //Combine the realms
                realms = realms.concat(canViewOwnRealms);
                realms = realms.concat(canEditOwnRealms);
                break;
            default:
                realms = service.retrieveActionableRealms(permissionString);
                break;
        }

        /////////////////////////////////////////////////////

        //If there are realms that we can do this in
        //then we can return true here
        if (realms.length) {
            return true;
        }

        /////////////////////////////////////////////////////

        //Check if the user has any permissions on the parent type that would allow them to perform the action
        if (parentType && parentType.length) {

            //Check if we have flowdown from the parent type
            var includeDefined = service.retrieveActionableRealms('include defined ' + parentType);

            //If not there is no point continuing with the check
            if (!includeDefined.length) {
                return false;
            }

            //If so we now need to check if we can perform
            //the action on the parent in any realms
            switch (action) {
                case 'view any':
                    var canViewAnyParentRealms = service.retrieveActionableRealms('view any ' + parentType);
                    var canEditAnyParentRealms = service.retrieveActionableRealms('edit any ' + parentType);

                    //Combine the realms
                    realms = realms.concat(canViewAnyRealms);
                    realms = realms.concat(canEditAnyRealms);
                    break;
                case 'view own':
                    var canViewOwnParentRealms = service.retrieveActionableRealms('view own ' + parentType);
                    var canEditOwnParentRealms = service.retrieveActionableRealms('edit own ' + parentType);

                    //Combine the realms
                    realms = realms.concat(canViewOwnParentRealms);
                    realms = realms.concat(canEditOwnParentRealms);
                    break;
                default:
                    realms = service.retrieveActionableRealms(action + ' ' + parentType);
                    break;
            }

            if (realms.length) {
                ////////console.log('Return true because of parent permissions')
                return true;
            }
        }

        //Nope we cant
        return false;

    }

    /////////////////////////////////////////////////////

    //Flatten all children for a specified permission set
    //so you get a flat array of included realm ids
    //this function is recursive and will include all sub realms
    function retrieveKeys(set, additional) {
        if (set.children && set.children.length) {
            _.each(set.children, function(child) {
                retrieveKeys(child, additional);
            })
        }

        additional.push(String(set._id));
    }

    //////////////////////////////////

    /**
     * Retrieves all realms the acting user or application can perform an action in
     * @param  {String} permission The permission string to retrieve realms for
     * @return {Array}        An array of realms that the user can perform the action in
     * @alias FluroAccess.retrieveActionableRealms  
     * @example
     *
     * //Returns an array of all realms the user is allowed to do the specified action
     * var realms = fluro.access.retrieveActionableRealms('create photo');
     */
    service.retrieveActionableRealms = function(action) {

        //Get the current acting user session
        var session = service.retrieveCurrentSession();

        //No session so can't perform any actions
        //in any realms
        if (!session) {
            return [];
        }

        /////////////////////////////////

        //Get the permission sets
        var permissionSets = session.permissionSets;


        //Find all realms that the current acting session
        //can perform the specified action in
        var realms = _.chain(permissionSets)
            .map(function(realmSet, key) {

                //Does the set include this permission
                var hasPermission = _.includes(realmSet.permissions, action);

                if (hasPermission) {
                    var keys = [];
                    retrieveKeys(realmSet, keys);
                    return keys;
                }
            })
            .flatten()
            .compact()
            .value();

        /////////////////////////////////

        return realms;
    }



    ///////////////////////////////////////////////////////////////////////////////

    /**
     * Check whether a user has a specific permission, useful for checking custom permissions
     * or simply whether or not a user has a permission in any realm
     * @param  {String}  permission The permission to check
     * @return {Boolean}            
     * @alias FluroAccess.has  
     * @example
     *
     * //Returns true or false if the user has the permission 
     * var hasPermission = fluro.access.has('create photo');
     */
    service.has = function(permission) {

        //Get the current acting user session
        var user = service.retrieveCurrentSession();

        if (!user) {
            return false;
        }

        if (service.isFluroAdmin()) {
            return true;
        }

        ///////////////////////////////////////////////////////////////////////////////

        var permissionSets = user.permissionSets;

        //Get all of the possible permissions
        var permissions = _.chain(permissionSets)
            .reduce(function(results, set, key) {

                results.push(set.permissions);

                return results;
            }, [])
            // .map(retrieveSubRealms)
            .flattenDeep()
            .compact()
            .uniq()
            .value();

        //Check if any of the users permissions include the one
        //we are looking for
        return _.includes(permissions, permission);
    }

    /////////////////////////////////////////////////////
    /**
     * Checks whether the currently authenticated user is the author or owner of a specified
     * content item
     * @param  {Object}  item The item to check if the user is an author of
     * @return {Boolean}      
     * @alias FluroAccess.isAuthor  
     * @example
     *
     * //Returns true or false
     * var isAuthor = fluro.access.isAuthor({title:'My article', _id:'55bbf345de...'});
     */
    service.isAuthor = function(item) {

        //Get the current acting user session
        var user = service.retrieveCurrentSession();

        if (!user) {
            return false;
        }

        if (!item) {
            return false;
        }



        ////////////////////////////////////////

        var userID = FluroCore.utils.getStringID(user);
        var authorID = FluroCore.utils.getStringID(item.author);

        //The user is the author if the user's id matches
        //the content author's id
        var author = userID == authorID;

        ////////////////////////////////////////

        //If we are the author at this point
        //return early
        if (author) {
            return true;
        }

        //Check if the persona matches the managed author
        var personaID = FluroCore.utils.getStringID(user.persona);
        var managedAuthorID = FluroCore.utils.getStringID(item.managedAuthor);

        //If the user's persona is the managed author of the content
        if (personaID == managedAuthorID) {
            author = true;
        }
        ////////////////////////////////////////

        //If we are the author at this point
        //return early
        if (author) {
            return true;
        }

        ////////////////////////////////////////

        //Check if the item has any owners listed on it
        var ownerIDs = FluroCore.utils.arrayIDs(item.owners);

        //If owners are listed
        if (ownerIDs && ownerIDs.length) {
            //Check if the user is listed as an owner
            author = _.includes(ownerIDs, userID);
        }

        ////////////////////////////////////////

        //If we are the author at this point
        //return early
        if (author) {
            return true;
        }


        ////////////////////////////////////////

        //Check if the item has any managed owners listed on it
        var managedOwnerIDs = FluroCore.utils.arrayIDs(item.managedOwners);

        //If managed owners are listed
        if (managedOwnerIDs && managedOwnerIDs.length) {
            //Check if the user is listed as an owner
            author = _.includes(managedOwnerIDs, personaID);
        }

        ////////////////////////////////////////

        var itemID = FluroCore.utils.getStringID(item);

        //If the user is trying to edit their own user
        if (userID == itemID) {
            author = true;
        }

        //If the user is trying to edit their own persona
        if (personaID == itemID) {
            author = true;
        }

        return author;
    }


    /////////////////////////////////////////////////////

    /**
     * Check whether the current acting user can edit a specified content item
     * @param  {Object} item The item to check if the user can edit
     * @return {Boolean}    
     * @alias FluroAccess.canEditItem  
     * @example
     *
     * //Returns true
     * var canEdit = fluro.access.canEditItem({title:'My article', _id:'55bbf345de...'});
     */
    service.canEditItem = function(item, isUser) {

        if (!item) {
            return false;
        }

        //Get the current acting user or application
        var user = service.retrieveCurrentSession();

        if (!user) {
            return false;
        }

        //Store the itemID in case we need to reference it below
        var itemID = FluroCore.utils.getStringID(item);

        /////////////////////////////////////

        //Check the account of the user
        //and the account of the content
        var userAccountID = FluroCore.utils.getStringID(user.account);
        var contentAccountID = FluroCore.utils.getStringID(item.account);

        //If there is an account listed on the content and it does not
        //match the account of the user then we can't edit it
        if (contentAccountID && (contentAccountID != userAccountID)) {
            return false;
        }

        /////////////////////////////////////

        //If we are a Fluro Admin we can do anything!
        if (service.isFluroAdmin()) {
            return true;
        }

        /////////////////////////////////////

        //Get the definition name of the item
        //we are trying to edit
        var definitionName = item._type;
        var parentType;

        //If the item is a defined type
        //store the definition and the parent type
        if (item.definition) {
            definitionName = item.definition;
            parentType = item._type;
        }

        ////////////////////////////////////////

        //Check if the user is the author of this content
        var author = service.isAuthor(item);

        //If the content we are checking is a Fluro User
        //We used to allow the user to edit their own user
        //but we don't allow this anymore
        //user profile
        // if (isUser) {
        //     definitionName = 'user';
        //     if (author) {
        //         return true;
        //     }
        // }

        ////////////////////////////////////////

        //Find the realms we are allowed to edit this kind of content in
        var editAnyRealms = service.retrieveActionableRealms('edit any ' + definitionName);
        var editOwnRealms = service.retrieveActionableRealms('edit own ' + definitionName);

        ////////////////////////////////////////

        //Keep track of the realms of the content
        var contentRealmIDs;

        //If we are checking a realm then we need to check the trail
        //instead of the 'item.realms' array
        if (definitionName == 'realm' || parentType == 'realm') {

            //Check the realm.trail
            contentRealmIDs = FluroCore.utils.arrayIDs(item.trail);

            //Include the realm itself
            contentRealmIDs.push(itemID);
        } else {

            //Retrieve all the realms the content is currently in
            contentRealmIDs = FluroCore.utils.arrayIDs(item.realms);
        }

        ////////////////////////////////////////

        //Check if the user has any permissions on the parent type that will allow them to access this content
        if (parentType && parentType.length) {

            var includeDefined = service.retrieveActionableRealms('include defined ' + parentType);

            //If we can adjust the parent and it's defined child types in any realms
            if (includeDefined.length) {

                var canEditAnyParentRealms = service.retrieveActionableRealms('edit any ' + parentType);
                editAnyRealms = editAnyRealms.concat(canEditAnyParentRealms);

                var canEditOwnParentRealms = service.retrieveActionableRealms('edit own ' + parentType);
                editOwnRealms = editOwnRealms.concat(canEditOwnParentRealms);
            }
        }

        ////////////////////////////////////////

        //Find realms the content is in that we are allowed to edit within
        var matchedAnyRealms = _.intersection(editAnyRealms, contentRealmIDs);

        //We are allowed to edit anything in these realms
        //So return true
        if (matchedAnyRealms.length) {
            return true;
        }

        ////////////////////////////////////////

        //If we are the author of the content
        if (author) {

            //Find own matches between this content
            var matchedOwnRealms = _.intersection(editOwnRealms, contentRealmIDs);

            //We are allowed to edit anything in these realms
            //So return true
            if (matchedOwnRealms.length) {
                return true;
            }
        }

        return false;
    }

    /////////////////////////////////////////////////////

    /**
     * Check whether the current acting user can view a specified content item
     * @param  {Object} item The item to check if the user can view
     * @return {Boolean}    
     * @alias FluroAccess.canViewItem  
     * @example
     *
     * //Returns true
     * var canView = fluro.access.canViewItem({title:'My article', _id:'55bbf345de...'});
     */
    service.canViewItem = function(item, isUser) {

        if (!item) {
            return false;
        }

        //Get the current acting user or application
        var user = service.retrieveCurrentSession();

        if (!user) {
            return false;
        }

        /////////////////////////////////////

        //If we are a Fluro Admin we can do anything!
        if (service.isFluroAdmin()) {
            return true;
        }

        /////////////////////////////////////

        //Store the itemID in case we need to reference it below
        var itemID = FluroCore.utils.getStringID(item);

        /////////////////////////////////////

        var definitionName = item._type;
        var parentType

        if (item.definition) {
            definitionName = item.definition;
            parentType = item._type;
        }

        ////////////////////////////////////////
        //Check if the user is the author of this content
        var author = service.isAuthor(item);

        // if (isUser) {
        //     definitionName = 'user';

        //     if (author) {
        //         return true;
        //     }
        // }

        ////////////////////////////////////////

        //Get the realms we are allowed to work in
        var viewAnyRealms = service.retrieveActionableRealms('view any ' + definitionName);
        var viewOwnRealms = service.retrieveActionableRealms('view own ' + definitionName);
        var editAnyRealms = service.retrieveActionableRealms('edit any ' + definitionName);
        var editOwnRealms = service.retrieveActionableRealms('edit own ' + definitionName);

        //Combine any
        var combinedAnyRealms = [];
        combinedAnyRealms = combinedAnyRealms.concat(viewAnyRealms);
        combinedAnyRealms = combinedAnyRealms.concat(editAnyRealms);

        //Combine own
        var combinedOwnRealms = [];
        combinedOwnRealms = combinedOwnRealms.concat(viewOwnRealms);
        combinedOwnRealms = combinedOwnRealms.concat(editOwnRealms);

        ////////////////////////////////////////

        //Keep track of the realms of the content
        var contentRealmIDs;

        //If we are checking a realm then we need to check the trail
        //instead of the 'item.realms' array
        if (definitionName == 'realm' || parentType == 'realm') {

            //Check the realm.trail
            contentRealmIDs = FluroCore.utils.arrayIDs(item.trail);

            //Include the realm itself
            contentRealmIDs.push(itemID);
        } else {

            //Retrieve all the realms the content is currently in
            contentRealmIDs = FluroCore.utils.arrayIDs(item.realms);
        }

        ////////////////////////////////////////

        //Check if the user has any permissions on the parent type that will allow them to access this content
        if (parentType && parentType.length) {
            var includeDefined = service.retrieveActionableRealms('include defined ' + parentType);

            if (includeDefined.length) {
                var canEditAnyParentRealms = service.retrieveActionableRealms('edit any ' + parentType);
                var canViewAnyParentRealms = service.retrieveActionableRealms('view any ' + parentType);
                combinedAnyRealms = combinedAnyRealms.concat(canEditAnyParentRealms, canViewAnyParentRealms);

                var canEditOwnParentRealms = service.retrieveActionableRealms('edit own ' + parentType);
                var canViewOwnParentRealms = service.retrieveActionableRealms('view own ' + parentType);
                combinedOwnRealms = combinedOwnRealms.concat(canEditOwnParentRealms, canViewOwnParentRealms);
            }
        }

        ////////////////////////////////////////

        //Find any matches between this content
        var matchedAnyRealms = _.intersection(combinedAnyRealms, contentRealmIDs);

        //We are allowed to view anything in these realms
        //So return true
        if (matchedAnyRealms.length) {
            return true;
        }

        ////////////////////////////////////////

        //If we are the author
        if (author) {
            //Find own matches between this content
            var matchedOwnRealms = _.intersection(combinedOwnRealms, contentRealmIDs);

            //We are allowed to view anything in these realms
            //So return true
            if (matchedOwnRealms.length) {
                return true;
            }
        }

        return false;

    }


    /////////////////////////////////////////////////////

    /**
     * Check whether the current acting user can delete a specified content item
     * @param  {Object} item The item to check if the user can delete
     * @return {Boolean}  
     * @alias FluroAccess.canDeleteItem  
     * @example
     *
     * //Returns true
     * var canDelete = fluro.access.canDeleteItem({title:'My article', _id:'55bbf345de...'});
     */
    service.canDeleteItem = function(item, isUser) {

        if (!item) {
            return false;
        }

        //Get the current acting user or application
        var user = service.retrieveCurrentSession();

        if (!user) {
            return false;
        }

        //Store the itemID in case we need to reference it below
        var itemID = FluroCore.utils.getStringID(item);

        /////////////////////////////////////

        //Check the account of the user
        //and the account of the content
        var userAccountID = FluroCore.utils.getStringID(user.account);
        var contentAccountID = FluroCore.utils.getStringID(item.account);

        //If there is an account listed on the content and it does not
        //match the account of the user then we can't delete it
        if (contentAccountID && (contentAccountID != userAccountID)) {
            return false;
        }

        /////////////////////////////////////

        //If we are a Fluro Admin we can do anything!
        if (service.isFluroAdmin()) {
            return true;
        }

        /////////////////////////////////////

        //Get the definition name of the item
        //we are trying to delete
        var definitionName = item._type;
        var parentType;

        //If the item is a defined type
        //store the definition and the parent type
        if (item.definition) {
            definitionName = item.definition;
            parentType = item._type;
        }

        ////////////////////////////////////////

        //Check if the user is the author of this content
        var author = service.isAuthor(item);

        //If the content we are checking is a Fluro User
        //We used to allow the user to delete their own user
        //but we don't allow this anymore
        //user profile
        // if (isUser) {
        //     definitionName = 'user';
        //     if (author) {
        //         return true;
        //     }
        // }

        ////////////////////////////////////////

        //Find the realms we are allowed to delete this kind of content in
        var deleteAnyRealms = service.retrieveActionableRealms('delete any ' + definitionName);
        var deleteOwnRealms = service.retrieveActionableRealms('delete own ' + definitionName);

        ////////////////////////////////////////

        //Keep track of the realms of the content
        var contentRealmIDs;

        //If we are checking a realm then we need to check the trail
        //instead of the 'item.realms' array
        if (definitionName == 'realm' || parentType == 'realm') {

            //Check the realm.trail
            contentRealmIDs = FluroCore.utils.arrayIDs(item.trail);

            //Include the realm itself
            contentRealmIDs.push(itemID);
        } else {

            //Retrieve all the realms the content is currently in
            contentRealmIDs = FluroCore.utils.arrayIDs(item.realms);
        }

        ////////////////////////////////////////

        //Check if the user has any permissions on the parent type that will allow them to access this content
        if (parentType && parentType.length) {

            var includeDefined = service.retrieveActionableRealms('include defined ' + parentType);

            //If we can adjust the parent and it's defined child types in any realms
            if (includeDefined.length) {

                var canEditAnyParentRealms = service.retrieveActionableRealms('delete any ' + parentType);
                deleteAnyRealms = deleteAnyRealms.concat(canEditAnyParentRealms);

                var canEditOwnParentRealms = service.retrieveActionableRealms('delete own ' + parentType);
                deleteOwnRealms = deleteOwnRealms.concat(canEditOwnParentRealms);
            }
        }

        ////////////////////////////////////////

        //Find realms the content is in that we are allowed to delete within
        var matchedAnyRealms = _.intersection(deleteAnyRealms, contentRealmIDs);

        //We are allowed to delete anything in these realms
        //So return true
        if (matchedAnyRealms.length) {
            return true;
        }

        ////////////////////////////////////////

        //If we are the author of the content
        if (author) {

            //Find own matches between this content
            var matchedOwnRealms = _.intersection(deleteOwnRealms, contentRealmIDs);

            //We are allowed to delete anything in these realms
            //So return true
            if (matchedOwnRealms.length) {
                return true;
            }
        }

        return false;
    }

    /////////////////////////////////////////////////////

    service.retrieveSelectableRealms = function(action, type, parentType, noCache) {

        return new Promise(function(resolve, reject) {




            //Get the current acting user or application
            var user = service.retrieveCurrentSession();

            if (!user) {
                 resolve([]);
                 return;
            }

            //If we are a super user
            if (service.isFluroAdmin()) {

                //This returns the full list of all realms in a proper tree structure
                FluroCore.api.get('/realm/tree').then(function(res) {
                	return resolve(res.data)
                }, reject);
                return;
            }

            ////////////////////////////////////////////////////

            //Get the permission sets of the user
            //and then map the structure
            var permissionSets = user.permissionSets;

            //Permission String to search for
            var searchString = `${action} ${type}`;


            /////////////////////////////////////////////////////

            //Flatten all children for a specified permission set
            //so you a flat array of realm ids that are included
            function retrieveSubRealms(set) {

                var results = [set];

                if (set.children && set.children.length) {
                    _.each(set.children, function(child) {
                        var additional = retrieveSubRealms(child);
                        results = results.concat(additional);
                    })

                }
                return results;
            }

            ////////////////////////////////////////////////////

            //Find all realms on the top level that we have the requested permission
            //in and then get all child realms and flatten the list, this will give us
            //all the realms that we can do the action in.
            var selectableRealms = _.chain(permissionSets)
                .filter(function(realmSet, key) {

                    //Find all permission sets where the user has the requested permission
                    var includesType = _.includes(realmSet.permissions, searchString);
                    var includedFromParent;

                    /**/
                    //If the parent type was provided also then check any sub definitions
                    //of the basic type
                    if (parentType && parentType.length) {

                        //Check if we can action the parent type
                        var includesParent = _.includes(realmSet.permissions, action + ' ' + parentType);

                        //Check if we can action variants of the parent type
                        var includesVariations = _.includes(realmSet.permissions, 'include defined ' + parentType);

                        //Include this realm if both of the above return true
                        includedFromParent = (includesParent && includesVariations);
                    }

                    var shouldInclude = (includesType || includedFromParent)
                    return shouldInclude;
                })
                //Recursively get all the child realms
                .map(retrieveSubRealms)
                .flattenDeep()
                .map(function(realm) {
                    return _.pick(realm, [
                        'title',
                        'definition',
                        '_discriminator',
                        '_discriminatorType',
                        'trail',
                        'color',
                        'bgColor',
                        '_id',
                    ])
                })
                .uniq(function(realm) {
                    return realm._id
                })
                .orderBy(function(realm) {
                    if (realm.trail) {
                        return realm.trail.length;
                    } else {
                        return 0;
                    }
                })
                .reduce(function(set, realm) {

                    var lastRealmParent = _.last(realm.trail);

                    if (set[lastRealmParent]) {
                        if (!set[lastRealmParent].children) {
                            set[lastRealmParent].children = [];
                        }
                        set[lastRealmParent].children.push(realm);
                        realm.nested = true;
                    }

                    set[realm._id] = realm;


                    return set;
                }, {})
                .values()
                .filter(function(realm) {
                    return !realm.nested;
                })
                .orderBy(function(realm) {
                    return realm.title;
                })
                .value();

            /////////////////////////////////////

            //Create a copy of the realm so we aren't mucking around with original user object
            // var realmTree = angular.copy(selectableRealms);



            //Resolve with our tree
            return resolve(selectableRealms);

        })

    }



   /**
    * @name FluroAccess.addEventListener
    * @description Adds a callback that will be triggered whenever the specified event occurs
    * @function
    * @param {String} event The event to listen for
    * @param {Function} callback The function to fire when this event is triggered
    * @example
    * //Listen for when the user session changes
    * FluroAccess.addEventListener('change', function(userSession) {})
    */
   
   /**
    * @name FluroAccess.removeEventListener
    * @description Removes all a callback from the listener list
    * @function
    * @param {String} event The event to stop listening for
    * @param {Function} callback The function to remove from the listener list
    * @example
    * //Stop listening for the change event
    * FluroAccess.removeEventListener('change', myFunction)
    */
   
   /**
    * @name FluroAccess.removeAllListeners
    * @description Removes all listening callbacks for all events
    * @function
    * @example
    * FluroAccess.removeAllListeners()
    */

    //////////////////////////////////

    return service;

}

///////////////////////////////////////////////////////////////////////////////



export default FluroAccess;