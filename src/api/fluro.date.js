

import _ from 'lodash';
import moment from 'moment-timezone';

///////////////////////////////////////////////////////////////////////////////

const FluroDate = {
    defaultTimezone:Intl.DateTimeFormat().resolvedOptions().timeZone,
}

///////////////////////////////////////////////////////////////////////////////

FluroDate.localDate = function(d, specifiedTimezone) {
    
    //Date
    var date;// = new Date(d);

    if(!d) {
        date = new Date();
    } else {
        date = new Date(d);
    }

    ///////////////////////////////////////////

    var timezoneOffset;
    var browserOffset = date.getTimezoneOffset();

    ///////////////////////////////////////////

    if(!specifiedTimezone) {
        specifiedTimezone = FluroDate.defaultTimezone;
    }

    if(specifiedTimezone) {
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

// https://momentjs.com/docs/#/displaying/format/
FluroDate.formatDate = function(dateString, format, timezone) {    
    var date = FluroDate.localDate(dateString, timezone);
    return moment(date).format(format);
}

///////////////////////////////////////

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

    if (!event.endDate) {
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
                return startDate.format('D') + '-' + endDate.format('D MMM')
            }

            if (sameYear) {
                //20 Aug - 21 Sep 2016
                return startDate.format('D') + '-' + endDate.format('D MMM')
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
                return startDate.format('D') + '-' + endDate.format('D MMM Y')
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

///////////////////////////////////////////////////////////////////////////////

export default FluroDate;