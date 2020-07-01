import _ from 'lodash';


///////////////////////////////////////////////////////////////////////////////

/**
 * @classdesc A static service that provides useful tools when working with video content
 * @class
 * @hideconstructor
 */
var FluroVideo = {};

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

FluroVideo.getAssetMediaIDFromURL = function(url, type) {

    var lowercase = String(url).toLowerCase();

    if (!type) {
        if (lowercase.includes('youtube')) {
            type = 'youtube'
        } else if (lowercase.includes('vimeo')) {
            type = 'vimeo'
        }
    }


    var mediaID;
    switch (type) {
        case 'youtube':
            mediaID = FluroVideo.getYouTubeIDFromURL(url)
            break;
        case 'vimeo':
            mediaID = FluroVideo.getVimeoIDFromURL(url)
            break;
    }

    return mediaID;
}


///////////////////////////////////////////////////////////////////////////////

FluroVideo.getYouTubeIDFromURL = function(url) {

    if (!url || !url.length) {
        return;
    }


    function contains(str, substr) {
        return (str.indexOf(substr) > -1);
    }

    //////////////////////////////////////

    function getParm(url, base) {
        var re = new RegExp("(\\?|&)" + base + "\\=([^&]*)(&|$)");
        var matches = url.match(re);
        if (matches) {
            return (matches[2]);
        } else {
            return ("");
        }
    }

    //////////////////////////////////////

    var videoID;
    var matches;

    //////////////////////////////////////


    if (url.indexOf("youtube.com/watch") != -1) {
        videoID = getParm(url, "v");
    } else {

        var youtubeRegexp = /https?:\/\/(?:[0-9A-Z-]+\.)?(?:youtu\.be\/|youtube(?:-nocookie)?\.com\S*[^\w\s-])([\w-]{11})(?=[^\w-]|$)(?![?=&+%\w.-]*(?:['"][^<>]*>|<\/a>))[?=&+%\w.-]*/ig;

        //Get the id
        var YoutubeID = url.replace(youtubeRegexp, '$1');

        if (contains(YoutubeID, ';')) {
            var pieces = YoutubeID.split(';');

            if (contains(pieces[1], '%')) {
                // links like this:
                // "http://www.youtube.com/attribution_link?a=pxa6goHqzaA&amp;u=%2Fwatch%3Fv%3DdPdgx30w9sU%26feature%3Dshare"
                // have the real query string URI encoded behind a ';'.
                // at this point, `YoutubeID is 'pxa6goHqzaA;u=%2Fwatch%3Fv%3DdPdgx30w9sU%26feature%3Dshare'
                var uriComponent = decodeURIComponent(YoutubeID.split(';')[1]);
                YoutubeID = ('https://youtube.com' + uriComponent)
                    .replace(youtubeRegexp, '$1');
            } else {
                // https://www.youtube.com/watch?v=VbNF9X1waSc&amp;feature=youtu.be
                // `YoutubeID` looks like 'VbNF9X1waSc;feature=youtu.be' currently.
                // strip the ';feature=youtu.be'
                YoutubeID = pieces[0];
            }
        } else if (contains(YoutubeID, '#')) {
            // YoutubeID might look like '93LvTKF_jW0#t=1'
            // and we want '93LvTKF_jW0'
            YoutubeID = YoutubeID.split('#')[0];
        }
        videoID = YoutubeID;
    }

    //////console.log('Video thumb', url, retVal);
    return videoID;
}

///////////////////////////////////////////////////////////////////////////////


FluroVideo.getVimeoIDFromURL = function(url) {

    if (!url || !url.length) {
        return;
    }

    //Vimeo RegExp
    var reg = /https?:\/\/(?:www\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
    var match = url.match(reg);
    if (match) {
        return match[3];
    }
}

///////////////////////////////////////////////////////////////////////////////


/**
 * @alias FluroVideo.readableMilliseconds
 * @param  {Number} milliseconds The number of milliseconds to get duration for
 * @return {String}            The query string
 * @example 
 * Fluro.readableMilliseconds(100000)
 */
FluroVideo.readableMilliseconds = function(milliseconds, withoutSuffix) {

    var oneSecond = 1000;
    var oneMinute = oneSecond * 60;
    var oneHour = oneMinute * 60;
    var oneDay = oneHour * 24;

    var seconds = (milliseconds % oneMinute) / oneSecond;
    var minutes = Math.floor((milliseconds % oneHour) / oneMinute);
    var hours = Math.floor((milliseconds % oneDay) / oneHour);
    var days = Math.floor(milliseconds / oneDay);


    var timeString = '';

    if (withoutSuffix) {
        if (days !== 0) {
            timeString += (days !== 1) ? (days + 'd ') : (days + 'd ');
        }
        if (hours !== 0) {
            timeString += (hours !== 1) ? (hours + 'h ') : (hours + 'h ');
        }
        if (minutes !== 0) {
            timeString += (minutes !== 1) ? (minutes + 'm ') : (minutes + 'm ');
        }
        if (seconds !== 0 || milliseconds < 1000) {
            timeString += (seconds !== 1) ? (seconds.toFixed(0) + 's ') : (seconds.toFixed(0) + 's ');
        }
    } else {
        if (days !== 0) {
            timeString += (days !== 1) ? (days + ' days ') : (days + ' day ');
        }
        if (hours !== 0) {
            timeString += (hours !== 1) ? (hours + ' hrs ') : (hours + 'hr ');
        }
        if (minutes !== 0) {
            timeString += (minutes !== 1) ? (minutes + ' mins ') : (minutes + 'min ');
        }
        if (seconds !== 0 || milliseconds < 1000) {
            timeString += (seconds !== 1) ? (seconds.toFixed(0) + 's ') : (seconds.toFixed(0) + 's ');
        }
    }

    return timeString;
}

///////////////////////////////////////////////////////////////////////////////

/**
 * @alias FluroVideo.readableSeconds
 * @param  {Number} seconds The number of seconds to get duration for
 * @return {String}            The query string
 * @example 
 * Fluro.readableSeconds(10)
 */

FluroVideo.readableSeconds = function(seconds, withoutSuffix) {

    return FluroVideo.readableMilliseconds(seconds * 1000, withoutSuffix);

    // var milliseconds = seconds * 1000;
    // var oneSecond = 1000;
    // var oneMinute = oneSecond * 60;
    // var oneHour = oneMinute * 60;
    // var oneDay = oneHour * 24;

    // var seconds = (milliseconds % oneMinute) / oneSecond;
    // var minutes = Math.floor((milliseconds % oneHour) / oneMinute);
    // var hours = Math.floor((milliseconds % oneDay) / oneHour);
    // var days = Math.floor(milliseconds / oneDay);

    // var timeString = '';
    // if (days !== 0) {
    //     timeString += (days !== 1) ? (days + ' days ') : (days + ' day ');
    // }
    // if (hours !== 0) {
    //     timeString += (hours !== 1) ? (hours + ' hrs ') : (hours + 'hr ');
    // }
    // if (minutes !== 0) {
    //     timeString += (minutes !== 1) ? (minutes + ' mins ') : (minutes + 'min ');
    // }
    // if (seconds !== 0 || milliseconds < 1000) {
    //     timeString += (seconds !== 1) ? (seconds.toFixed(1) + 's ') : (seconds.toFixed(1) + 's ');
    // }

    // return timeString;
}

///////////////////////////////////////////////////////////////////////////////

/**
 * @alias FluroVideo.hhmmss
 * @param  {Number} seconds The number of seconds to get duration for
 * @return {String}            The query string
 * @example 
 * //Returns 01:02:00
 * Fluro.hhmmss(62)
 */

FluroVideo.hhmmss = function(secs) {


    function secToTimer(sec) {
        let o = new Date(0)
        let p = new Date(sec * 1000)
        return new Date(p.getTime() - o.getTime())
            .toISOString()
            .split("T")[1]
            .split("Z")[0]
    }


    return secToTimer(secs).split('.')[0];



    // function pad(str) {
    //     return ("0" + str).slice(-2);
    // }

    // // function hhmmss(secs) {
    // var minutes = Math.floor(secs / 60);
    // secs = secs % 60;
    // var hours = Math.floor(minutes / 60)
    // minutes = minutes % 60;
    // return pad(hours) + ":" + pad(minutes) + ":" + pad(secs);
    // return pad(minutes)+":"+pad(secs);
    // }
    // return hhmmss(seconds);
}




/////////////////////////////////////////////
/////////////////////////////////////////////
/////////////////////////////////////////////
/////////////////////////////////////////////
/////////////////////////////////////////////


export default FluroVideo;