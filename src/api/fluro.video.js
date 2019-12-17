import _ from 'lodash';


///////////////////////////////////////////////////////////////////////////////

/**
 * @classdesc A static service that provides useful tools when working with video content
 * @class
 * @hideconstructor
 */
var FluroVideo = {};

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

        if(withoutSuffix) {
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
        function pad(str) {
            return ("0" + str).slice(-2);
        }

        // function hhmmss(secs) {
        var minutes = Math.floor(secs / 60);
        secs = secs % 60;
        var hours = Math.floor(minutes / 60)
        minutes = minutes % 60;
        return pad(hours) + ":" + pad(minutes) + ":" + pad(secs);
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