


# Fluro Javascript API

[Site](https://fluro.io) |
[Documentation](https://fluro-developers.github.io/fluro/) |
[REST API Documentation](https://developer.fluro.io) |
[Support](https://support.fluro.io)


## Installation

```
npm install fluro --save
```


## Getting Started

```
//Import the Fluro module
import Fluro from 'fluro';

//Set some defaults 
const API_URL = 'https://api.fluro.io';
const APPLICATION_TOKEN = '$55fkshadh12425324...';
const APPLICATION_DOMAIN_NAME = 'https://myapplication.com'; 

//Create a new Fluro instance
const fluro = new Fluro({
    apiURL: API_URL,
    applicationToken: APPLICATION_TOKEN,
    domain:APPLICATION_DOMAIN_NAME,
});

//Optionally set a default timezone (otherwise will default to browser clock timezone)
fluro.date.defaultTimezone = 'Australia/Melbourne';

```


## Authentication
The FluroAuth service makes it easy to handle actions and behaviours like login, logout, signup, reset password etc.
It's often a good idea to save the user's session, which contains refresh and access tokens to local storage
Once you have authenticated the fluro module will take care of authenticating your requests, refreshing tokens before they expire and caching data
for more information checkout the [FluroAuth module](https://fluro-developers.github.io/fluro/FluroAuth.html)

If a static application token has been set then when a user signs out of the app all requests are made as the application instead of the user

```

//Listen for when the user logs in/out
fluro.auth.addEventListener('change', userUpdated);

/////////////////////////////////////////////

//Update whenever the user session changes
function userUpdated(user) {
    
    if(user) {
    	//The user is logged in and you have their session details
    	window.localStorage.userSession = user;
    } else {
    	//The user is logged out
    }

    //Get new information for the user's 'likes', 'plays', 'pins' etc..
    fluro.stats.refresh();
}

/////////////////////////////////////////////


//Set the user session object if we already have it in localStorage
fluro.auth.set(window.localStorage.userSession);


/////////////////////////////////////////////

//Login to the server as a general Fluro user
fluro.auth.login({
	'username':'you@youremail.com',
	'password':'yourpassword',
}).then(function(user) {
	//We are now logged in
})
.catch(function(err) {
	//Couldn't sign in
	console.log(err.message);
});


/////////////////////////////////////////////

//Login to the server as a persona (whitelabelled user)
//By providing the application:true property
fluro.auth.login({
	'username':'you@youremail.com',
	'password':'yourpassword',
}, {
	application:true
}).then(function(user) {
	//We are now logged in
})
.catch(function(err) {
	//Couldn't sign in
	console.log(err.message);
});

/////////////////////////////////////////////

//Logout and clear all caches
//And revert back to the application if a token has been provided
fluro.auth.logout()




```


## Handling Errors
The FluroUtils service has a handy function for translating an error into a human readable message, this can be 
be helpful when needing to show error messages to the user
```

/////////////////////////////////////////////

//Get the user session
fluro.api.get('/content/event/5ca3d64dd2bb085eb9d450db')
.then(function(response) {
	//Success
})
.catch(function(err) {
	var errorMessage = fluro.utils.errorMessage(err);
	console.log(errorMessage);
});




```
