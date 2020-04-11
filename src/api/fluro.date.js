import _ from 'lodash';
import moment from 'moment-timezone';
import FluroUtils from './fluro.utils';

///////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////////////////////////////////////////////

var DEFAULT_TIMEZONE;

if (!(typeof window === 'undefined')) {
    DEFAULT_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
}

///////////////////////////////////////////////////////////////////////////////

/**
 * @classdesc A static service that provides useful functions for working with dates and timestamps.
 * @class
 * @hideconstructor
 */

const FluroDate = {
    defaultTimezone: DEFAULT_TIMEZONE,
    moment,
}


///////////////////////////////////////////////////////////////////////////////

/**
 * A function that returns all of the available timezones. Often used to populate a select box
 * @alias FluroDate.timezones
 * @return {Array}                   An array of all availble timezones.
 */

FluroDate.timezones = function() {
    return moment.tz.names();
}

///////////////////////////////////////////////////////////////////////////////

/**
 * A function that will return a date in context of a specified timezone
 * If no timezone is specified then the default timezone of the current clock will be used.
 * This will return dates that are incorrect on purpose. So that it can appear to the user as if they were in another timezone.
 * As Javascript dates are always in the context of the timezone they are being viewed in, this function will give you a date that is technically
 * not the Universal point in time of the date, but rather a time that reads in your timezone as if you were in the specified timezone.
 * @alias FluroDate.localDate
 * @param  {Date} date      Either a javascript date object, or a string timestamp representing a javascript date object        
 * @param  {String} specifiedTimezone The timezone to retrieve the date in eg. Australia/Melbourne   
 * @return {Date}                   A javascript date object transformed to match the specified timezone
 */
FluroDate.localDate = function(d, specifiedTimezone) {

    // console.log('LOCAL DATE', d, specifiedTimezone);
    //Date
    var date; // = new Date(d);

    if (!d) {
        date = new Date();
    } else {
        date = new Date(d);
    }

    ///////////////////////////////////////////

    var timezoneOffset;
    var browserOffset = date.getTimezoneOffset();

    ///////////////////////////////////////////

    // if (!specifiedTimezone) {
    //     specifiedTimezone = FluroDate.defaultTimezone;
    // }

    if (specifiedTimezone) {
        timezoneOffset = moment.tz(date, specifiedTimezone).utcOffset();
        browserOffset = moment(date).utcOffset();

        var difference = (timezoneOffset - browserOffset);
        var offsetDifference = difference * 60 * 1000;
        var prevDate = new Date(date);
        date.setTime(date.getTime() + offsetDifference);
    }

    return date;
}

///////////////////////////////////////////////////////////////////////////////

/**
 * A helpful function that can quickly get an age from a supplied date string
 * @alias FluroDate.getAge
 * @return {Integer}            The age in years
 * @example 
 * FluroDate.getAge('2019-04-18T23:00:00.000Z')
 */
FluroDate.getAge = function(dateInput) {
    var date = FluroDate.localDate(dateInput);
    // var today = new Date();
    var birthDate = new Date(dateInput);
    var age = today.getFullYear() - birthDate.getFullYear();

    var m = today.getMonth() - birthDate.getMonth();

    //If the date is on the cusp of the new year
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

///////////////////////////////////////////////////////////////////////////////


/**
 * Parses a date and returns a human readable date string
 * @param  {Date|String} date The date or string to parse
 * @param  {String} format     A string representing the format to output for formatting syntax see https://momentjs.com/docs/#/displaying/format/
 * @param  {String} timezone   The timezone to use if needing to translate the date to another timezone eg. Australia/Melbourne
 * @return {String}            A human readable string
 * @example
 * var date = new Date()
 * return FluroDate.formatDate(date, 'h:mma DDD MMM YYYY')
 * 
 * var dateString = '2019-04-18T23:00:00.000Z' 
 * return FluroDate.formatDate(dateString, 'D M YYYY', 'Australia/Melbourne')
 */
FluroDate.formatDate = function(dateString, format, timezone) {
    var date = FluroDate.localDate(dateString, timezone);

    return moment(date).format(format);
}



/**
 * Parses a date and returns a 'timeago' string
 * @param  {Date|String} date The date or string to parse
 * @return {String}            A human readable string
 * @example
 * var date = new Date()
 *
 * //Returns 10 mins ago
 * return fluro.date.timeago(date)
 */
FluroDate.timeago = function(date, suffix) {
    return moment(date).fromNow(suffix);
}

/**
 * Parses an ObjectID and returns the date of creation
 * @param  {String} id The id of the object to parse
 * @param  {String} format     A string representing the format to output for formatting syntax see https://momentjs.com/docs/#/displaying/format/
 * @param  {String} timezone   The timezone to use if needing to translate the date to another timezone eg. Australia/Melbourne
 * @return {String}            A human readable string
 * @example
 * 
 * var id = '5ca3d64dd2bb085eb9d450db' 
 * return dateFromID.formatDate(id, 'D M YYYY')
 */
FluroDate.dateFromID = function(id, format, timezone) {
    id = FluroUtils.getStringID(id);
    var date = new Date(parseInt(id.substring(0, 8), 16) * 1000);

    return FluroDate.formatDate(date, format, timezone);
}

///////////////////////////////////////


/**
 * Checks whether an event spans over multiple days
 * @param  {Object} event A Fluro event object with a startDate and an endDate
 * @return {Boolean}            True or False if the event spans multiple days
 * @example
 * 
 * return fluro.date.isMultiDayEvent({startDate:...})
 */
FluroDate.isMultiDayEvent = function(event) {


    var startDate;
    var endDate;

    ////////////////////////////////////////

    if (!event) return;

    ////////////////////////////////////////

    if (event.startDate) {
        startDate = FluroDate.localDate(event.startDate, event.timezone);
    } else {
        return;
    }

    if (!event.endDate) {
        return;
    }

    ///////////////////////////////////////////////

    endDate = FluroDate.localDate(event.endDate, event.timezone);

    ///////////////////////////////////////////////

    startDate = moment(startDate);
    endDate = moment(endDate);

    ////////////////////////////////////////

    return (String(startDate.format('D MMM YYYY')) != String(endDate.format('D MMM YYYY')));
}

///////////////////////////////////////


/**
 * A helper function that can display a human-readable date for an event
 * taking into consideration the context of the current time, the event's start and end time.
 * This is often used as a string filter
 * and what is relevant
 * @alias FluroDate.readableEventDate
 * @param  {Object} event An object that has both a startDate and endDate property, Usually an event object from the Fluro API
 * @param  {String} style Whether to return a 'short', 'medium' or 'long' date
 * @return {String}       The human readable date for the event
 * @example
 * //Returns 5:30pm 1 May
 * FluroDate.readableEventDate({"startDate": "2019-05-01T07:30:00.000Z", "endDate":"2019-05-01T07:30:00.000Z"})

 * //Returns 5:30pm - 7:30pm 1 May
 * FluroDate.readableEventDate({"startDate": "2019-05-01T07:30:00.000Z", "endDate":"2019-05-01T09:30:00.000Z"})


 * //Returns 1 - 5 May 2015
 * FluroDate.readableEventDate({"startDate": "2015-05-01T07:30:00.000Z", "endDate":"2015-05-05T09:30:00.000Z"})

 * //1 May - 21 Jun 2019
 * FluroDate.readableEventDate({"startDate": "2019-05-01T07:30:00.000Z", "endDate":"2019-06-21T09:30:00.000Z"})

 */
FluroDate.readableEventDate = function(event, style) {

    ////////////////////////////////////////

    var startDate;
    var endDate;

    ////////////////////////////////////////

    if (!event) return;

    ////////////////////////////////////////

    if (event.startDate) {
        startDate = FluroDate.localDate(event.startDate, event.timezone);
    } else {
        return;
    }

    if (event.endDate) {
        endDate = FluroDate.localDate(event.endDate, event.timezone);
    } else {
        endDate = startDate;
    }


    ///////////////////////////////////////////////

    startDate = moment(startDate);
    endDate = moment(endDate);

    ///////////////////////////////////////////////

    var noEndDate = startDate.format('h:mma D MMM YYYY') == endDate.format('h:mma D MMM YYYY');
    var sameYear = (startDate.format('YYYY') == endDate.format('YYYY'));
    var sameMonth = (startDate.format('MMM YYYY') == endDate.format('MMM YYYY'));
    var sameDay = (startDate.format('D MMM YYYY') == endDate.format('D MMM YYYY'));

    switch (style) {
        case 'short':
            // console.log('SHORT', startDate, endDate);
            if (noEndDate) {
                return startDate.format('D MMM')
            }

            if (sameDay) {
                //8am - 9am Thursday 21 May 2016
                return startDate.format('D MMM')
            }

            if (sameMonth) {
                //20 - 21 May 2016
                return startDate.format('D') + ' - ' + endDate.format('D MMM')
            }

            if (sameYear) {
                //20 Aug - 21 Sep 2016
                return startDate.format('D') + ' - ' + endDate.format('D MMM')
            }

            //20 Aug 2015 - 21 Sep 2016
            return startDate.format('D MMM Y') + ' - ' + endDate.format('D MMM Y')

            break;
        case 'day':
            // console.log('SHORT', startDate, endDate);
            if (noEndDate) {
                return startDate.format('dddd D MMMM')
            }

            if (sameDay) {
                //8am - 9am Thursday 21 May 2016
                return startDate.format('dddd D MMMM')
            }

            if (sameMonth) {
                //20 - 21 May 2016
                return startDate.format('D') + ' - ' + endDate.format('D MMMM Y')
            }

            if (sameYear) {
                //20 Aug - 21 Sep 2016
                return startDate.format('D MMM') + ' - ' + endDate.format('D MMM Y')
            }

            //20 Aug 2015 - 21 Sep 2016
            return startDate.format('D MMM Y') + ' - ' + endDate.format('D MMM Y')

            break;
        default:
            if (noEndDate) {
                return startDate.format('h:mma dddd D MMM Y')
            }

            if (sameDay) {
                //8am - 9am Thursday 21 May 2016
                return startDate.format('h:mma') + ' - ' + endDate.format('h:mma dddd D MMM Y')
            }

            if (sameMonth) {
                //20 - 21 May 2016
                return startDate.format('D') + ' - ' + endDate.format('D MMM Y')
            }

            if (sameYear) {
                //20 Aug - 21 Sep 2016
                return startDate.format('D MMM') + ' - ' + endDate.format('D MMM Y')
            }

            //20 Aug 2015 - 21 Sep 2016
            return startDate.format('D MMM Y') + ' - ' + endDate.format('D MMM Y')

            break;
    }

}




///////////////////////////////////////


/**
 * A helper function that can display a human-readable time for an event
 * taking into consideration the context of the current time, the event's start and end time.
 * This is often used as a string filter
 * @alias FluroDate.readableEventTime
 * @param  {Object} event An object that has both a startDate and endDate property, Usually an event object from the Fluro API
 * @return {String}       The human readable time for the event
 * @example
 * //Returns 5:30pm
 * FluroDate.readableEventTime({"startDate": "2019-05-01T07:30:00.000Z", "endDate":null})

 * //Returns 5:30pm - 7:30pm
 * FluroDate.readableEventTime({"startDate": "2019-05-01T07:30:00.000Z", "endDate":"2019-05-01T09:30:00.000Z"})
 */
FluroDate.readableEventTime = function(event) {

    ////////////////////////////////////////

    var startDate;
    var endDate;

    ////////////////////////////////////////

    if (!event) return;

    ////////////////////////////////////////

    if (event.startDate) {
        startDate = FluroDate.localDate(event.startDate, event.timezone);
    } else {
        return;
    }

    if (event.endDate) {
        endDate = FluroDate.localDate(event.endDate, event.timezone);
    } else {
        endDate = startDate;
    }

    ///////////////////////////////////////////////

    startDate = moment(startDate);
    endDate = moment(endDate);

    ///////////////////////////////////////////////

    var noEndDate = startDate.format('h:mma D MMM YYYY') == endDate.format('h:mma D MMM YYYY');
    var sameYear = (startDate.format('YYYY') == endDate.format('YYYY'));
    var sameMonth = (startDate.format('MMM YYYY') == endDate.format('MMM YYYY'));
    var sameDay = (startDate.format('D MMM YYYY') == endDate.format('D MMM YYYY'));


    if (noEndDate) {
        return startDate.format('h:mma')
    }

    if (sameDay) {
        //8am - 9am Thursday 21 May 2016
        return startDate.format('h:mma') + ' - ' + endDate.format('h:mma');
    }


    return FluroDate.readableEventDate(event);

}






///////////////////////////////////////


/**
 * @alias FluroDate.groupEventByDate
 * @param  {Array} events The events we want to group
 * @return {Array}       A grouped array of dates and events
 */
FluroDate.groupEventByDate = function(events) {

    return _.chain(events)
        .reduce(function(set, row, index) {

            var format = 'ddd D MMM';
            var startDate = row.startDate ? new moment(row.startDate) : new moment(row.created);

            if (moment().format('YYYY') != startDate.format('YYYY')) {
                format = 'ddd D MMM YYYY';
            }

            var groupingKey = startDate.format(format);




            var existing = set[groupingKey];
            if (!existing) {
                existing = set[groupingKey] = {
                    title: groupingKey,
                    items: [],
                    index,
                }
            }

            existing.items.push(row);

            return set;
        }, {})
        .values()
        .orderBy('index')
        .value();
}



///////////////////////////////////////


/**
 * @alias FluroDate.timeline
 * @param  {Array} items The items we want to group on the timeline
 * @return {Array}       A grouped array of dates
 */
FluroDate.timeline = function(items, dateKey) {

    if (!dateKey) {
        dateKey = 'created';
    }

    return _.chain(items)
        .orderBy(function(entry) {
            var date = new Date(_.get(entry, dateKey));
            return date;
        })
        .reverse()
        .reduce(function(set, entry, index) {

            var date = new Date(_.get(entry, dateKey));

            ////////////////////////////////////////

            var dayKey = moment(date).format('D MMM YYYY');
            var monthKey = moment(date).format('MMM YYYY');
            var yearKey = moment(date).format('YYYY');

            ////////////////////////////////////////

            //Check if we already have an entry for this year
            var existingYear = set.lookup[yearKey];
            if (!existingYear) {
                existingYear = set.lookup[yearKey] = {
                    date,
                    months: [],
                }

                //Add the year to our results
                set.years.push(existingYear);
            }

            ////////////////////////////////////////

            //Check if we already have an entry for this month
            var existingMonth = set.lookup[monthKey];
            if (!existingMonth) {
                existingMonth = set.lookup[monthKey] = {
                    date,
                    days: [],
                }

                existingYear.months.push(existingMonth);
            }

            ////////////////////////////////////////

            //Check if we already have an entry for this month
            var existingDay = set.lookup[dayKey];
            if (!existingDay) {
                existingDay = set.lookup[dayKey] = {
                    date,
                    items: [],
                }

                existingMonth.days.push(existingDay);
            }

            existingDay.items.push(entry);


            return set;

        }, { lookup: {}, years: [] })
        .get('years')
        .value();


}



///////////////////////////////////////


/**
 * A helper function that can return the pieces for a countdown clock relative to a specified date
 * @alias FluroDate.countdown
 * @param  {Date} date The date we are counting down to
 * @return {Object}       An object with days, minutes, hours, seconds,
 */
FluroDate.countdown = function(date, zeroPadded) {

    var now = new Date().getTime();

    ////////////////////////////////////////

    var when = new Date(date).getTime();
    var milliseconds = when - now;


    var oneSecond = 1000;
    var oneMinute = oneSecond * 60;
    var oneHour = oneMinute * 60;
    var oneDay = oneHour * 24;

    var seconds = (milliseconds % oneMinute) / oneSecond;
    var minutes = Math.floor((milliseconds % oneHour) / oneMinute);
    var hours = Math.floor((milliseconds % oneDay) / oneHour);
    var days = Math.floor(milliseconds / oneDay);


    if (zeroPadded) {

        function pad(input) {
            input = Math.ceil(input);

            if (String(input).length == 1) {
                return `0${input}`;
            }

            return String(input);
        }

        return {
            days: pad(days),
            minutes: pad(minutes),
            hours: pad(hours),
            seconds: pad(seconds),
        }
    }

    return {
        days,
        minutes,
        hours,
        seconds: Math.ceil(seconds),
    }

}

///////////////////////////////////////////////////////////////////////////////

export default FluroDate;