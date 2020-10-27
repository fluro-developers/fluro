import _ from 'lodash';
import moment from 'moment-timezone';
import stringSimilarity from 'string-similarity';



var chrono; //= require('chrono-node');
var verboseDEBUG;


//////////////////////////////////////////////////////////////////////

var service = {};

//////////////////////////////////////////////////////////////////////

service.activeFilters = function(config) {

    var memo = [];
    getActiveFilter(config, memo);



    return memo;

    ////////////////////////////

    function getActiveFilter(block, memo) {

        var isValid = service.isValidFilter(block);
        if (isValid) {
            memo.push(block);
        }

        if (block.filters && block.filters.length) {
            _.each(block.filters, function(b) {
                getActiveFilter(b, memo);
            })
        }


    }
}

//////////////////////////////////////////////////////////////////////

function isNotANumber(input) {
    return isNaN(parseInt(input));
}

//////////////////////////////////////////////////////////////////////

service.activeFilterRows = function(config) {

    return _.filter(service.activeFilters, function(row) {
        return row.comparator && row.comparator.length;
    })
}


service.activeFilterKeys = function(config) {
    var keys = _.chain(service.activeFilters(config))
        .map(function(entry) {
            if (!entry || !entry.key) {
                return;
            }

            var rootKey = service.getRootKey(entry.key);
            // //console.log('ROOT KEY', rootKey);
            return rootKey;
        })
        .compact()
        .uniq()
        .value();

    return keys;
}


//////////////////////////////////////////////////////////////////////


service.activeFilterCriteriaString = function(config) {


    var criteriaValue = _.chain(service.activeFilters(config))
        .map(function(block) {

            if (!block.criteria || !block.criteria.length) {
                return;
            }

            //////////////////////////

            var activeCriteria = service.activeFilters({ filters: block.criteria });

            // ////console.log('ACTIVE CRITERIA', block.criteria, activeCriteria)
            if (!activeCriteria || !activeCriteria.length) {
                return;
            }

            //////////////////////////


            return service.getFilterChangeString({ filters: activeCriteria });
        })
        .flatten()
        .compact()
        .map(function(value) {
            var nameTitle = value.title || value.name || value._id || value;
            return String(nameTitle).toLowerCase();
        })
        .compact()
        .uniq()
        .value();

    ////////////////////////

    // if (criteriaValue && criteriaValue.length) {
    // ////console.log('FILTER VALUES', criteriaValue);
    // }

    ////////////////////////

    return criteriaValue;

}

//////////////////////////////////////////////////////////////////////

service.activeFilterValues = function(config) {

    var values = _.chain(service.activeFilters(config))
        .map(function(block) {

            var all = [];
            var comparator = service.getComparator(block.comparator);
            if (!comparator) {
                return;
            }

            switch (comparator.inputType) {
                case 'array':
                    all = all.concat(block.values);
                    break;
                case 'range':
                case 'daterange':
                    all = all.concat([block.value, block.value2]);
                    break;
                default:

                    var blockValue1 = block.value;
                    var blockValue2 = block.value2;

                    if(block.dataType == 'boolean') {
                        blockValue1 = String(service.convertToBoolean(blockValue1));
                        blockValue2 = String(service.convertToBoolean(blockValue2));
                    }   

                    all = all.concat([blockValue1, blockValue2]);
                    break;
            }

            return all;
        })
        .flatten()
        .compact()
        .map(function(value) {
            var nameTitle = value.title || value.name || value._id || value;
            return String(nameTitle).toLowerCase();
        })
        .compact()
        .uniq()
        .value();


    // ////console.log('FILTER VALUES', values);

    return values;

}

service.activeFilterComparators = function(config) {
    var memo = [];
    getActiveFilterComparator(config, memo);
    return memo;

    ////////////////////////////


    function getActiveFilterComparator(block, memo) {

        var isValid = service.isValidFilter(block);
        if (isValid) {
            memo.push(block.comparator);
        }

        if (block.filters && block.filters.length) {
            _.each(block.filters, function(b) {


                getActiveFilterComparator(b, memo);


            })
        }
    }
}

service.activeFilterOperators = function(config) {
    var memo = [];
    var trail = [];

    //////////////////////////

    getActiveFilterBlockOperator(config, memo, trail);

    //////////////////////////

    var flat = _.chain(memo)
        .flatten()
        .reduce(function(set, operator) {

            if (!set[operator]) {
                set[operator] = 0;
            }

            set[operator]++;

            return set;
        }, {})
        .map(function(i, key) {
            return `${i}${key}`;
        })
        .compact()
        .value();

    ////////////////////////////

    return flat;

    ////////////////////////////



    function getActiveFilterBlockOperator(block, memo, trail) {

        var operator = block.operator;

        //If it's a rule set
        if (operator) {

            // //Add the path to the block
            trail.push(operator);

            ///////////////////////////////

            //Check if any of it's filters are valid and active
            var isValid = _.some(block.filters, function(filter) {
                return service.isValidFilter(filter);
            })


            if (isValid) {
                memo.push(trail.slice());
            }
        } else {
            trail.length = 0;
        }

        ////////////////////////////////////////////////

        //Go down the tree further
        if (block.filters && block.filters.length) {
            _.each(block.filters, function(b) {
                getActiveFilterBlockOperator(b, memo, trail);
            })
        } else {
            trail.length = 0;
        }
    }
}

//////////////////////////////////////////////////////////////////////


service.getFilterChangeString = function(config) {

    //Put all this together so we only refilter when we actually need to
    //each of these will only return if the filter is valid and actually changes
    //effects the results, without this step the table will update everytime you change the filters
    var string = [
        service.activeFilterKeys(config).join(', '),
        service.activeFilterValues(config).join(', '),
        service.activeFilterComparators(config).join(', '),
        service.activeFilterOperators(config).join(', '),
        service.activeFilterCriteriaString(config).join(', '),

    ].join('');


    return string;
}

//////////////////////////////////////////////////////////////////////

//Helper function to map an input to a basic string
function getString(input, includeIDs) {

    if (!input) {
        return '';
    }


    if (includeIDs) {
        if (input._id) {
            return String(input._id).toLowerCase();
        }

        if (input._external) {
            return String(input._external).toLowerCase();
        }
    }

    if (input.title) {
        return String(input.title).toLowerCase();
    }

    if (input.name) {
        return String(input.name).toLowerCase();
    }

    return String(input).toLowerCase()
}

//////////////////////////////////////////////////////////////////////

function getAllStringMatches(input, includeIDs) {

    var matches = [];
    if (!input) {
        return matches;
    }

    //If it's text or a number
    if (!_.isObject(input)) {
        return [getString(input, includeIDs)];
    }

    //If it's an array
    if (_.isArray(input)) {
        return _.flatten(getAllStringMatches(input, includeIDs))
    }

    //Otherwise it's likely an object
    matches.push(getString(input, includeIDs));


    if (matches.length == 1) {
        return matches[0];
    }


    // if (includeIDs) {

    //     if (input._id && input._id.length) {
    //         matches.push(String(input._id).toLowerCase());
    //     }

    //     if (input._external && input._external.length) {
    //         matches.push(String(input._external).toLowerCase());
    //     }
    // }

    // if (input.title && input.title.length) {
    //     matches.push(String(input.title).toLowerCase());
    // }

    // if (input.name && input.name.length) {
    //     matches.push(String(input.name).toLowerCase());
    // }



    return matches;
}

//////////////////////////////////////////////////////////////////////

function isBetween(input, from, to) {

    var startFloat = parseFloat(from);
    var endFloat = parseFloat(to);
    var checkFloat = parseFloat(input || 0);

    var start = Math.min(startFloat, endFloat);
    var end = Math.max(startFloat, endFloat);

    var match = (checkFloat >= start) && (checkFloat <= end);

    return match;
}



//////////////////////////////////////////////////////////////////////

function isIn(input, range) {

    var stringInput = getString(input, true);

    //Range is the array we are checking in
    return _.some(range, function(entry) {

        var entryString = getString(entry, true);

        // ////console.log('CHECK', range, entry, stringInput, entryString)
        return stringInput == getString(entry, true);
    });
}

///////////////////////////////////

function isEmpty(input) {

    if (!input) {
        return true;
    }



    if (input == undefined) {
        return true;
    }

    if (input == null) {
        return true;
    }

    if (input == '') {
        return true;
    }

    if (_.isArray(input) && !input.length) {
        return true;
    }

    if (input == 0 || input == '0') {
        return true;
    }
}


///////////////////////////////////


service.matchAnyString = function(keywords, row) {

    //Get the keywords we want to search on
    var searchString = getString(keywords);

    if (_.isString(row)) {
        return checkString(row);
    } else {
        var values = _.values(row);
        return _.some(values, checkString)
    }

    /////////////////////////////////////

    function checkString(input) {
        var stringInput = getString(input);
        var exactMatch = _.includes(stringInput, searchString);
        // console.log('EXACT MATCH?', stringInput, string)
        return exactMatch || service.isSimilar(stringInput, searchString)
    }



}

///////////////////////////////////

service.isSimilar = function(input, mustMatchValue, options) {

    if (!options) {
        options = {};
    }

    var score = stringSimilarity.compareTwoStrings(getString(input), getString(mustMatchValue));
    var matches = (score >= 0.6);

    if (options.source) {
        if (!options._similar) {
            options._similar = 0;
        }

        //Increase the score
        options._similar += matches;
    }

    return matches;

}




///////////////////////////////////



///////////////////////////////////

function isEqual(input, range) {

    //Input is the field from the row, range is the filter input typed by the user
    // ////console.log('INPUT', input, range);
    var matchAny = getAllStringMatches(input, true);
    var rangeAsString = getString(range, true);

    // //console.log('CHECK MATCH', matchAny, rangeAsString);
    if (matchAny == rangeAsString) {
        return true;
    }

    return _.includes(matchAny, rangeAsString);

}

function isContained(input, range) {

    //TODO Check if this is necessary
    //As i think this will always be a string
    if (_.isString(range)) {
        range = getString(range);
    }

    return _.includes(range, getString(input));
}




///////////////////////////////


function dateCompare(input, range, type, format, timezone) {
    if (!input) {
        return false;
    }

    // var date1 = new Date(input);
    // date1.setHours(0, 0, 0, 0);

    // var date2 = new Date(range);
    // date2.setHours(0, 0, 0, 0);


    // ////console.log('CHECK DATE>>>>', input, range)
    var moment1 = moment.tz(input, timezone); //Birthday
    var moment2 = moment.tz(range, timezone); //Relative Date

    switch (type) {

        case 'next':
        case 'past':
            //We can go down to hourly
            break;

        default:
            //Just track the day
            moment1.startOf('day');
            moment2.startOf('day');
            break;
    }

    ///////////////////////////////////////////////////

    var date1 = moment1.toDate();
    var date2 = moment2.toDate();
    var now = new Date();

    ///////////////////////////////////////////////////

    var matched;

    switch (type) {
        case 'date':
            matched = String(date1) == String(date2);
            if (verboseDEBUG) {
                ////console.log('Matched', type, matched, String(date1), String(date2))
            }
            break;
        case 'week':
            matched = moment1.format('W YYYY') == moment2.format('W YYYY');
            if (verboseDEBUG) {
                ////console.log('Matched', type, matched, moment1.format('W YYYY'), moment2.format('W YYYY'))
            }
            break;
        case 'month':
            matched = moment1.format('M YYYY') == moment2.format('M YYYY');
            if (verboseDEBUG) {
                ////console.log('Matched', type, matched, moment1.format('M YYYY'), moment2.format('M YYYY'))
            }
            break;
        case 'year':
            matched = moment1.format('YYYY') == moment2.format('YYYY');
            if (verboseDEBUG) {
                ////console.log('Matched', type, matched, moment1.format('YYYY'), moment2.format('YYYY'))
            }
            break;
        case 'dateanniversary':
            matched = moment1.format('D MMM') == moment2.format('D MMM');
            if (verboseDEBUG) {
                ////console.log('Matched', type, matched, moment1.format('D MMM'), moment2.format('D MMM'))
            }
            break;
        case 'dateanniversarynext':
            var startRange = moment();
            var dateDiffYears = startRange.diff(moment1, 'years', true);
            var checkDate = moment1.add(Math.ceil(dateDiffYears), 'years').toDate();

            // //console.log('CHECK DATE Anniversary NEXT', date1, 'CHECK DATES', dateDiffYears, 'start:', startRange.toDate(), 'Anniversary:', checkDate, 'end:', date2);
            //If the date is earlier than now
            if (checkDate < now) {
                matched = false;
            } else {
                matched = checkDate.getTime() <= date2.getTime()
            }


            if (verboseDEBUG) {
                ////console.log('Matched', type, matched, date1, date2)
            }
            break;
        case 'dateanniversarypast':

            //moment1 the birthday
            //moment 2 is 5 days ago

            ///////////////////////////////////

            var startRange = moment2;
            var dateDiffYears = startRange.diff(moment1, 'years', true);
            var checkDate = moment1.add(Math.ceil(dateDiffYears), 'years').toDate();

            //If the date is earlier than now
            if (checkDate > now) {
                matched = false;
            } else {
                matched = checkDate.getTime() >= date2.getTime()
            }

            // if (matched) {
            // //console.log('CHECK DATE Anniversary PAST', startRange.toDate(), '-', checkDate, '-', now);
            // }



            if (verboseDEBUG) {
                ////console.log('Matched', type, matched, date1, date2)
            }
            break;


        case 'dateanniversarymonth':
            matched = moment1.format('MMM') == moment2.format('MMM');
            if (verboseDEBUG) {
                ////console.log('Matched', type, matched, moment1.format('MMM'), moment2.format('MMM'))
            }
            break;
            // case 'weekday':
            //     matched = moment(date1).format('dddd') == moment(date2).format('dddd');
            // break;
        case 'before':
            matched = date1.getTime() < date2.getTime()
            if (verboseDEBUG) {
                ////console.log('Matched', type, matched, date1, date2)
            }
            break;
        case 'after':
            matched = date1.getTime() >= date2.getTime()
            if (verboseDEBUG) {
                ////console.log('Matched', type, matched, date1, date2)
            }
            break;
        case 'next':
            //If the date is earlier than now
            if (date1 < now) {
                matched = false;
            } else {
                matched = date1.getTime() < date2.getTime()
            }


            if (verboseDEBUG) {
                ////console.log('Matched', type, matched, date1, date2)
            }
            break;
        case 'past':
            //If the date is later than now
            if (date1 > now) {
                matched = false;
            } else {
                matched = date1.getTime() >= date2.getTime()
            }


            if (verboseDEBUG) {
                ////console.log('Matched', type, matched, date1, date2)
            }
            break;
    }

    ///////////////////////////////////////////////////

    return matched;
}

///////////////////////////////

service.comparators = [];

///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////
///////////////////////////////

//Date Comparators
service.comparators.push({
    title: 'Is on day ',
    operator: 'datesameday',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        if (_.isArray(input)) {
            return _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'date', null, options.timezone);
            });
        } else {
            // dateCompare(input, range, type, format, timezone)
            return dateCompare(input, mustMatchValue, 'date', null, options.timezone);
        }

    },
    // dateDisplayFormat:'D MMM YYYY',
    restrict: [
        'date',
    ],
})

service.comparators.push({
    title: 'Anniversary Date',
    operator: 'dateanniversary',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        if (_.isArray(input)) {
            return _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'dateanniversary', null, options.timezone);
            });
        } else {
            return dateCompare(input, mustMatchValue, 'dateanniversary', null, options.timezone);
        }

    },
    dateDisplayFormat: 'YYYY',
    restrict: [
        'date',
    ],
})



// service.comparators.push({
//     title: 'Is between',
//     operator: 'datebetween',
//     match(input, mustMatchValue1, mustMatchValue2) {
//         var checkDate = new Date(input);
//         checkDate.setHours(0, 0, 0, 0);

//         var date1 = new Date(mustMatchValue1)
//         date1.setHours(0, 0, 0, 0);

//         var date2 = new Date(mustMatchValue2)
//         date2.setHours(0, 0, 0, 0);

//         return isBetween(checkDate.getTime(), date1.getTime(), date2.getTime());
//     },
//     restrict: [
//         'date',
//     ],
//     inputType: 'daterange',
// })

service.comparators.push({
    title: 'Anniversary is Between',
    operator: 'dateanniversarybetween',
    match(input, mustMatchValue1, mustMatchValue2, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        if (!input) {
            return;
        }


        var checkDate = new Date(input);
        if (isNaN(checkDate)) {
            return;
        }


        checkDate.setHours(0, 0, 0, 0);

        var date1 = new Date(mustMatchValue1)
        date1.setHours(0, 0, 0, 0);

        var date2 = new Date(mustMatchValue2)
        date2.setHours(0, 0, 0, 0);

        ////////////////////////////////////////

        var startDate = new Date(Math.min(date1, date2));
        var endDate = new Date(Math.max(date1, date2));

        ////////////////////////////////////////

        function zeroPadded(str) {
            str = String(str);

            if (str.length == 1) {
                return '0' + str;
            }

            return str;
        }

        ////////////////////////////////////////

        var checkTimestamp = parseInt(`${zeroPadded(checkDate.getMonth())}${zeroPadded(checkDate.getDate())}`);
        var startTimestamp = parseInt(`${zeroPadded(startDate.getMonth())}${zeroPadded(startDate.getDate())}`);
        var endTimestamp = parseInt(`${zeroPadded(endDate.getMonth())}${zeroPadded(endDate.getDate())}`);

        return checkTimestamp >= startTimestamp && checkTimestamp <= endTimestamp;
    },
    dateDisplayFormat: 'YYYY',
    restrict: [
        'date',
    ],
    inputType: 'daterange',
})




// service.comparators.push({
//     title: 'Anniversary Month',
//     operator: 'dateanniversarymonth',
//     match(input, mustMatchValue) {
//         // ////console.log('TEST MONTH', mustMatchValue);

//         if (_.isArray(input)) {
//             //Check if any of the dates on the row
//             return _.some(input, function(i) {

//                 //match any of the dates provided in the array
//                 return _.some(mustMatchValue, function(d) {
//                     return dateCompare(i, d, 'dateanniversarymonth');
//                 });
//             });
//         } else {
//             //check if the date on the row matches any of the dates
//             //in our array
//             return _.some(mustMatchValue, function(d) {
//                 return dateCompare(input, d, 'dateanniversarymonth');
//             });
//         }

//     },
//     dateDisplayFormat: 'MMMM',
//     restrict: [
//         'date',
//     ],
//     inputType: 'array',
// })

/**/
service.comparators.push({
    title: 'Is same week as',
    operator: 'datesameweek',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        if (_.isArray(input)) {
            return _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'week', null, options.timezone);
            });
        } else {
            return dateCompare(input, mustMatchValue, 'week', null, options.timezone);
        }

    },
    dateDisplayFormat: '[Wk]W YYYY',
    restrict: [
        'date',
    ],
    inputType: 'array',
})

service.comparators.push({
    title: 'Is same month as',
    operator: 'datesamemonth',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        //     match(input, mustMatchValue) {

        //     var mustMatchString = String(mustMatchValue);

        //     // ////console.log('Check date input', input);


        //     if (_.isArray(input)) {
        //         return _.some(input, function(i) {
        //            var weekdayInteger = moment(i).weekday()
        //            return _.includes(mustMatchString, weekdayInteger);
        //         });
        //     } else {
        //          var weekdayInteger = moment(input).weekday()
        //          return _.includes(mustMatchString, weekdayInteger);
        //     }



        // },



        if (_.isArray(input)) {
            return _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'month', null, options.timezone);
            });
        } else {
            return dateCompare(input, mustMatchValue, 'month', null, options.timezone);
        }

    },
    dateDisplayFormat: 'MMM YYYY',
    restrict: [
        'date',
    ],
})

service.comparators.push({
    title: 'Is same year as',
    operator: 'datesameyear',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        if (_.isArray(input)) {
            return _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'year', null, options.timezone);
            });
        } else {
            return dateCompare(input, mustMatchValue, 'year', null, options.timezone);
        }

    },
    dateDisplayFormat: 'YYYY',
    restrict: [
        'date',
    ],
})
/**/

service.comparators.push({
    title: 'Is weekday',
    operator: 'datesameweekday',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        var mustMatchString = String(mustMatchValue);

        // ////console.log('Check date input', input);


        if (_.isArray(input)) {
            return _.some(input, function(i) {
                var weekdayInteger = moment(i).weekday()
                return _.includes(mustMatchString, weekdayInteger);
            });
        } else {
            var weekdayInteger = moment(input).weekday()
            return _.includes(mustMatchString, weekdayInteger);
        }
    },
    dateDisplayFormat: 'dddd',
    restrict: [
        'date',
    ],
    inputType: 'array',
})


////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////


service.comparators.push({
    title: 'Is before',
    operator: 'datebefore',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        if (!input) {
            return;
        }

        if (_.isArray(input)) {

            if (!input.length) {
                return;
            }

            return _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'before', null, options.timezone);
            });
        } else {
            return dateCompare(input, mustMatchValue, 'before', null, options.timezone);
        }




    },
    restrict: [
        'date',
    ],
})


service.comparators.push({
    title: 'Is after',
    operator: 'dateafter',
    match(input, mustMatchValue, NOT_USED, options) {


        if (!options) {
            options = {}
        }

        if (!input) {
            return;
        }

        if (_.isArray(input)) {

            if (!input.length) {
                return;
            }


            return _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'after', null, options.timezone);
            });
        } else {

            // ////console.log('COMPARE DATE', input)
            var RESULT = dateCompare(input, mustMatchValue, 'after', null, options.timezone);

            // ////console.log('CHECK', RESULT, input, mustMatchValue, options);
            return RESULT;
        }
    },
    restrict: [
        'date',
    ],
})




service.comparators.push({
    title: 'Is not before',
    operator: 'datenotbefore',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        if (!input) {
            return true;
        }

        if (_.isArray(input)) {
            if (!input.length) {
                return true;
            }

            //Every entry is not before
            return _.every(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return !dateCompare(i, mustMatchValue, 'before', null, options.timezone);
            });
        } else {
            return !dateCompare(input, mustMatchValue, 'before', null, options.timezone);
        }
    },
    restrict: [
        'date',
    ],
})


service.comparators.push({
    title: 'Is not after',
    operator: 'datenotafter',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        if (!input) {
            // ////console.log('TEST > NO INPUT')
            return true;
        }

        if (_.isArray(input)) {
            if (!input.length) {
                // ////console.log('TEST > NO INPUT LENGTH')
                return true;
            }

            //Every entry is not after
            var allMatch = _.every(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return !dateCompare(i, mustMatchValue, 'after', null, options.timezone);
            });

            // ////console.log('TEST > ALL MATCH?', allMatch)
            return allMatch;
        } else {
            var matchSingle = !dateCompare(input, mustMatchValue, 'after', null, options.timezone);
            // ////console.log('TEST > MATCH SINGLE', matchSingle, input, mustMatchValue)
            return matchSingle;
        }
    },
    restrict: [
        'date',
    ],
})





////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////




service.comparators.push({
    title: 'Anniversary is in the next',
    inputType: 'datemeasure',
    operator: 'dateanniversarynext',
    match(input, measure, period, options) {

        if (!options) {
            options = {}
        }

        if (!input) {
            return;
        }

        var mustMatchValue = moment().add(measure, period).toDate();

        if (_.isArray(input)) {

            if (!input.length) {
                return;
            }

            return _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'dateanniversarynext', null, options.timezone);
            });
        } else {
            return dateCompare(input, mustMatchValue, 'dateanniversarynext', null, options.timezone);
        }




    },
    restrict: [
        'date',
    ],
})


service.comparators.push({
    title: 'Anniversary is in the last',
    inputType: 'datemeasure',
    operator: 'dateanniversarypast',
    match(input, measure, period, options) {


        if (!options) {
            options = {}
        }

        if (!input) {
            return;
        }

        var mustMatchValue = moment().subtract(measure, period).toDate();

        if (_.isArray(input)) {

            if (!input.length) {
                return;
            }


            return _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'dateanniversarypast', null, options.timezone);
            });
        } else {
            return dateCompare(input, mustMatchValue, 'dateanniversarypast', null, options.timezone);
        }
    },
    restrict: [
        'date',
    ],
})





service.comparators.push({
    title: 'Is in the next',
    inputType: 'datemeasure',
    operator: 'datenext',
    match(input, measure, period, options) {

        if (!options) {
            options = {}
        }

        //////////////////////////

        var value;

        //////////////////////////

        if (!input) {
            return value;
        }

        var mustMatchValue = moment().add(measure, period).toDate();

        if (_.isArray(input)) {

            if (!input.length) {
                return value;
            }

            value = _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'next', null, options.timezone);
            });
        } else {
            value = dateCompare(input, mustMatchValue, 'next', null, options.timezone);
        }

        return value;
    },
    restrict: [
        'date',
    ],
})


service.comparators.push({
    title: 'Is in the last',
    inputType: 'datemeasure',
    operator: 'datepast',
    match(input, measure, period, options) {


        if (!options) {
            options = {}
        }

        //////////////////////////

        var value;

        //////////////////////////

        if (!input) {
            return value;
        }

        var mustMatchValue = moment().subtract(measure, period).toDate();

        if (_.isArray(input)) {

            if (!input.length) {
                return value;
            }


            value = _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'past', null, options.timezone);
            });
        } else {
            value = dateCompare(input, mustMatchValue, 'past', null, options.timezone);
        }

        return value;
    },
    restrict: [
        'date',
    ],
})



////////////////////////////////////////////////////////////

service.comparators.push({
    title: 'Is not in the next',
    inputType: 'datemeasure',
    operator: 'datenotnext',
    match(input, measure, period, options) {

        if (!options) {
            options = {}
        }

        //////////////////////////

        var value;

        //////////////////////////

        if (!input) {
            return !value;
        }

        var mustMatchValue = moment().add(measure, period).toDate();

        if (_.isArray(input)) {

            if (!input.length) {
                return !value;
            }

            value = _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'next', null, options.timezone);
            });
        } else {
            value = dateCompare(input, mustMatchValue, 'next', null, options.timezone);
        }

        return !value;
    },
    restrict: [
        'date',
    ],
})


service.comparators.push({
    title: 'Is in the last',
    inputType: 'datemeasure',
    operator: 'datenotpast',
    match(input, measure, period, options) {


        if (!options) {
            options = {}
        }

        //////////////////////////

        var value;

        //////////////////////////

        if (!input) {
            return !value;
        }

        var mustMatchValue = moment().subtract(measure, period).toDate();

        if (_.isArray(input)) {

            if (!input.length) {
                return !value;
            }


            value = _.some(input, function(i) {
                // dateCompare(input, range, type, format, timezone)
                return dateCompare(i, mustMatchValue, 'past', null, options.timezone);
            });
        } else {
            value = dateCompare(input, mustMatchValue, 'past', null, options.timezone);
        }

        return !value;
    },
    restrict: [
        'date',
    ],
})








////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////


service.comparators.push({
    title: 'Is between',
    operator: 'datebetween',
    match(input, mustMatchValue1, mustMatchValue2, options) {

        if (!options) {
            options = {}
        }

        // ////console.log('----------------------------------------')
        // ////console.log('TIMEZONE Check timezone options', options.timezone)
        // ////console.log('Before', input, mustMatchValue1, mustMatchValue2);




        var date1 = new Date(mustMatchValue1)
        date1.setHours(0, 0, 0, 0);

        var date2 = new Date(mustMatchValue2)
        date2.setHours(0, 0, 0, 0);


        // ////console.log('After', input, date1, date2);


        if (_.isArray(input)) {
            return _.some(input, function(i) {
                var checkDate = new Date(i);
                checkDate.setHours(0, 0, 0, 0);
                return isBetween(checkDate.getTime(), date1.getTime(), date2.getTime());
            });
        } else {
            var checkDate = new Date(input);
            checkDate.setHours(0, 0, 0, 0);

            return isBetween(checkDate.getTime(), date1.getTime(), date2.getTime());
        }
    },
    restrict: [
        'date',
    ],
    inputType: 'daterange',
})

service.comparators.push({
    title: 'Is not between',
    operator: 'datenotbetween',
    match(input, mustMatchValue1, mustMatchValue2, options) {

        if (!options) {
            options = {}
        }

        var date1 = new Date(mustMatchValue1)
        date1.setHours(0, 0, 0, 0);

        var date2 = new Date(mustMatchValue2)
        date2.setHours(0, 0, 0, 0);

        if (_.isArray(input)) {

            return !_.some(input, function(i) {
                var checkDate = new Date(i);
                checkDate.setHours(0, 0, 0, 0);
                return isBetween(checkDate.getTime(), date1.getTime(), date2.getTime());
            });

        } else {
            var checkDate = new Date(input);
            checkDate.setHours(0, 0, 0, 0);

            return !isBetween(checkDate.getTime(), date1.getTime(), date2.getTime());
        }


    },
    restrict: [
        'date',
    ],
    inputType: 'daterange',
})



///////////////////////////////
///////////////////////////////
///////////////////////////////


service.comparators.push({
    title: 'Is one of',
    operator: 'in',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }


        if (_.isArray(input)) {

            //Check if any match
            return _.some(input, function(i) {
                return isIn(i, mustMatchValue);
            });
        } else {

            var matches = isIn(input, mustMatchValue);
            // ////console.log('Must match value', matches, input, mustMatchValue);

            return matches;
        }
    },
    restrict: [
        'string',
        'email',
        'url',
        // 'number',
        // 'integer',
        // 'decimal',
        // 'float',
        'reference',
    ],
    inputType: 'array',
})

service.comparators.push({
    title: 'Is not one of',
    operator: 'notin',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }
        if (_.isArray(input)) {
            return !_.some(input, function(i) {
                return isIn(i, mustMatchValue);
            });
        } else {
            return !isIn(input, mustMatchValue);
        }
    },
    restrict: [
        'string',
        'email',
        'url',
        //'number',
        //'integer',
        //'decimal',
        //'float',
        'reference',
    ],
    inputType: 'array',
})



service.comparators.push({
    title: 'Is ',
    operator: '==',

    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }
        if (_.isArray(input)) {
            return _.some(input, function(i) {
                return isEqual(i, mustMatchValue);
            });
        } else {
            return isEqual(input, mustMatchValue);
        }
    },
    restrict: [
        'string',
        'email',
        'url',
        'boolean',
        'number',
        'integer',
        'decimal',
        'float',
        'reference',
    ],
})

service.comparators.push({
    title: 'Is not',
    operator: '!=',
    positive: false,
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }
        if (_.isArray(input)) {
            return !_.some(input, function(i) {
                return isEqual(i, mustMatchValue);
            });
        } else {
            return !isEqual(input, mustMatchValue);
        }
    },
    restrict: [
        'string',
        'email',
        'url',
        'boolean',
        'number',
        'integer',
        'decimal',
        'float',
        'reference',
    ],
})

service.comparators.push({
    title: 'Starts with',
    operator: 'startswith',

    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }
        if (_.isArray(input)) {
            return _.some(input, function(i) {
                return _.startsWith(getString(i), getString(mustMatchValue))
            });
        } else {
            return _.startsWith(getString(input), getString(mustMatchValue))
        }
    },
    restrict: [
        'string',
        'email',
        'url',
        'reference',
    ],

})



service.comparators.push({
    title: 'Ends with',
    operator: 'endswith',

    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }
        if (_.isArray(input)) {
            return _.some(input, function(i) {
                return _.endsWith(getString(i), getString(mustMatchValue))
            });
        } else {
            return _.endsWith(getString(input), getString(mustMatchValue))
        }
    },
    restrict: [
        'string',
        'email',
        'url',

        'reference',
    ],
})


service.comparators.push({
    title: 'Is similar to',
    operator: 'like',

    match(input, mustMatchValue, mustMatchValue2, options) {

        if (_.isArray(input)) {
            return _.some(input, function(i) {
                return service.isSimilar(i, mustMatchValue);
            });
        } else {
            return service.isSimilar(input, mustMatchValue);
        }
    },
    restrict: ['string'],
})

service.comparators.push({
    title: 'Contains characters',
    operator: 'contains',

    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }
        if (_.isArray(input)) {
            return _.some(input, function(i) {
                return isContained(mustMatchValue, i);
            });
        } else {
            return isContained(mustMatchValue, input);
        }
    },
    restrict: ['string'],
})

service.comparators.push({
    title: 'Does not contain characters',
    operator: 'excludes',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }
        if (_.isArray(input)) {
            return !_.some(input, function(i) {
                return isContained(mustMatchValue, i);
            });
        } else {
            return !isContained(mustMatchValue, input);
        }
    },
    restrict: ['string'],
})


service.comparators.push({
    title: 'Is greater than',
    operator: '>',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }
        return parseFloat(input || 0) > parseFloat(mustMatchValue || 0);
    },
    restrict: [
        'number',
        'integer',
        'decimal',
        'float',
    ],
})



service.comparators.push({
    title: 'Is less than',
    operator: '<',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        if (isNotANumber(input)) {
            return;
        }

        return parseFloat(input || 0) < parseFloat(mustMatchValue || 0);
    },
    restrict: [

        'number',
        'integer',
        'decimal',
        'float',
    ],
})

service.comparators.push({
    title: 'Is not greater than',
    operator: '!>',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }
        return !(parseFloat(input || 0) > parseFloat(mustMatchValue || 0));
    },
    restrict: [
        'number',
        'integer',
        'decimal',
        'float',
    ],
})


service.comparators.push({
    title: 'Is not less than',
    operator: '!<',
    match(input, mustMatchValue, NOT_USED, options) {
        if (!options) {
            options = {}
        }
        return !(parseFloat(input || 0) < parseFloat(mustMatchValue || 0));
    },
    restrict: [

        'number',
        'integer',
        'decimal',
        'float',
    ],
})

service.comparators.push({
    title: 'Is greater than or equal to',
    operator: '>=',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        if (isNotANumber(input)) {
            return;
        }

        return parseFloat(input || 0) >= parseFloat(mustMatchValue || 0);
    },
    restrict: [

        'number',
        'integer',
        'decimal',
        'float',
    ],
})

service.comparators.push({
    title: 'Is less than or equal to',
    operator: '<=',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }

        if (isNotANumber(input)) {
            return;
        }


        return parseFloat(input || 0) <= parseFloat(mustMatchValue || 0);
    },
    restrict: [

        'number',
        'integer',
        'decimal',
        'float',
    ],
})

service.comparators.push({
    title: 'Is between',
    operator: 'between',
    match(input, mustMatchValue1, mustMatchValue2, options) {

        if (!options) {
            options = {}
        }


        return isBetween(input, mustMatchValue1, mustMatchValue2);
    },
    restrict: [

        'number',
        'integer',
        'decimal',
        'float',
    ],
    inputType: 'range',
})


service.comparators.push({
    title: 'Is not between',
    operator: 'notbetween',
    match(input, mustMatchValue1, mustMatchValue2, options) {

        if (!options) {
            options = {}
        }
        return !isBetween(input, mustMatchValue1, mustMatchValue2);
    },
    restrict: [

        'number',
        'integer',
        'decimal',
        'float',
    ],
    inputType: 'range',
})

service.comparators.push({
    title: 'Is empty',
    operator: 'empty',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }


        var result = isEmpty(input);

        // ////console.log('CHECK IF IS EMPTY!!', result, input, mustMatchValue)

        return result;
    },
    inputType: 'none',
})

service.comparators.push({
    title: 'Is not empty',
    operator: 'notempty',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }
        return !isEmpty(input);
    },
    inputType: 'none',
})



service.comparators.push({
    title: 'Does not start with',
    operator: 'doesnotstartwith',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }
        if (_.isArray(input)) {
            return !_.some(input, function(i) {
                return _.startsWith(getString(i), getString(mustMatchValue))
            });
        } else {
            return !_.startsWith(getString(input), getString(mustMatchValue))
        }
    },
    restrict: [
        'string',
        'email',
        'url',

        'reference',
    ],
})

service.comparators.push({
    title: 'Does not end with',
    operator: 'doesnotendwith',
    match(input, mustMatchValue, NOT_USED, options) {

        if (!options) {
            options = {}
        }
        if (_.isArray(input)) {
            return !_.some(input, function(i) {
                return _.endsWith(getString(i), getString(mustMatchValue))
            });
        } else {
            return !_.endsWith(getString(input), getString(mustMatchValue))
        }
    },
    restrict: [
        'string',
        'email',
        'url',

        'reference',
    ],
})


var allTypes = [
    'string',
    'email',
    'url',
    'phone',
    'date',
    'boolean',
    'number',
    'integer',
    'decimal',
    'float',
    'reference',
]

///////////////////////////////

service.comparatorLookup = {};
service.comparatorTypeLookup = {};

///////////////////////////////

//Loop through each available comparator
_.each(service.comparators, function(comparator) {


    //map each comparator
    service.comparatorLookup[comparator.operator] = comparator;

    ///////////////////////////////////////////////

    //Find any restrictions for this comparator
    var restrictTypes = comparator.restrict || [];

    //If there are none, then it's available to all types
    if (!restrictTypes.length) {
        restrictTypes = allTypes;
    }

    // console.log('ADD', comparator.operator, restrictTypes);

    //And map to each type it's restricted for
    _.each(restrictTypes, function(type) {

        var existing = service.comparatorTypeLookup[type];

        if (!existing) {
            existing = service.comparatorTypeLookup[type] = [];
        }

        //Add the comparator to the list
        existing.push(comparator);

    })

});

// console.log('COMPARATOR KEYS', _.keys(service.comparatorLookup), _.keys(service.comparatorTypeLookup));

///////////////////////////////


//Quick fast way to retrieve the comparator
service.getComparator = function(operator) {
    return service.comparatorLookup[operator]
}

//////////////////////////////////////////////////////////////////

service.getComparatorsForType = function(type) {
    //Return the matches or just all comparators
    return service.comparatorTypeLookup[type] || service.comparators;
}

////////////////////////////////////////////////////////

service.isValidFilter = function(block) {

    if (block.operator) {
        return _.some(block.filters, service.isValidFilter);
    }
    ////////////////////////////////////////////////////////

    var comparator = service.getComparator(block.comparator);
    if (!comparator) {
        return;
    }


    // ////console.log('CHECK', block)

    ////////////////////////////////////////////////////////

    var key = service.getRootKey(block.key);
    if (!key || !key.length) {
        return;
    }


    ////////////////////////////////////////////////////////


    var computedValue;
    if (block.computedValue && String(block.computedValue).length) {
        computedValue = block.computedValue;
    }

    ////////////////////////////////////////////////////////



    switch (comparator.inputType) {
        case 'none':
            return true;
            break;
        case 'range':
            if (!block.value || isNaN(block.value)) {
                return;
            }

            if (!block.value2 || isNaN(block.value2)) {
                return;
            }
            break;
        case 'daterange':
            if (!block.value || !_.isDate(new Date(block.value))) {
                return;
            }

            if (!block.value2 || !_.isDate(new Date(block.value))) {
                return;
            }

            break;
        case 'array':
            if (!block.values || !block.values.length) {
                return;
            }
            break;
        default:

            if (block.computedValue) {
                // ////console.log('Its a computed value!', block);
                return true;
            }

            if(block.dataType == 'boolean') {
                switch(String(block.value).toLowerCase()) {
                    case 'yes':
                    case 'true':
                    case 'false':
                    case 'no':
                    case '1':
                    case '0':
                        return true;
                    break;
                    default:
                        return;
                    break;
                }
            } else {
                if (!block.value || !_.isDate(new Date(block.value))) {
                   
                    return;
                }
            }

            // if (!block.value || !_.isDate(new Date(block.value))) {
            //     return;
            // }
            break;

    }


    return true;
}


//////////////////////////////////////////////////////////////////

service.filterGroupMatch = function(filterGroup, filterOptions, item) {

    //If it's a group
    if (!filterOptions) {
        filterOptions = {};
    }

    ///////////////////////////////

    var operator = filterGroup.operator;
    var returnValue;

    //Find valid filters and order by weight (so we can try and be as efficient as possible)
    function filterWeight(filter) {

        var dataKey = filter.dataType;
        var comparatorKey = filter.comparator;

        if (!dataKey && !comparatorKey) {
            return 0;
        }

        /////////////////////////////////////

        var pathComplexity = occurrences(filter.key, '[]');

        /////////////////////////////////////

        var comparatorWeight = service.getComparatorWeight(comparatorKey);

        /////////////////////////////////////

        var dataTypeWeight = 0;

        switch (dataKey) {

            case 'number':
            case 'integer':
            case 'decimal':
            case 'float':
                dataTypeWeight = 2;
                break;
            case 'date':
                dataTypeWeight = 3;
                break;
            case 'reference':
                dataTypeWeight = 4;
                break;
            case 'string':
            case 'email':
            case 'url':
            default:
                dataKey = 'string';
                dataTypeWeight = 1;
                break;

        }

        /////////////////////////////////////

        var weightString = `${pathComplexity}${dataTypeWeight}${comparatorWeight}`;


        var finalWeight = parseInt(weightString);
        // ////console.log('WEIGHT', filter.key, weightString);//dataKey, comparatorKey, finalWeight, 'FROM', weightString);
        return finalWeight;
    }


    ///////////////////////////////

    var validFilters = _.chain(filterGroup.filters)
        .filter(service.isValidFilter)
        .orderBy(filterWeight)
        .value();

    ///////////////////////////////

    // ////console.log('check filter', item)

    // ////console.log('ALL VALID FILTERS?', validFilters, '____', _.get(item, 'details.safeChurchTraining.items[0].data'))

    if (validFilters && validFilters.length) {

        switch (operator) {
            case 'or':
                returnValue = _.some(validFilters, function(filterBlock) {
                    var wasMatch = service.filterMatch(filterBlock, filterOptions, item)

                    return wasMatch;
                })
                break;
            case 'nor':

                //If any of these return true
                returnValue = _.some(validFilters, function(filterBlock) {
                    var wasMatch = service.filterMatch(filterBlock, filterOptions, item)
                    return !wasMatch;
                })

                // ////console.log('NOR', returnValue)

                break;
            case 'and':
            default:
                returnValue = _.every(validFilters, function(filterBlock) {
                    var wasMatch = service.filterMatch(filterBlock, filterOptions, item)
                    // if(!wasMatch) {
                    //     //console.log(wasMatch, 'was not a match', filterBlock)
                    // }

                    // //console.log('Was', item, wasMatch, filterBlock)
                    return wasMatch;
                })
                break;
        }

    } else {
        ////console.log('No valid filters!');
    }

    return returnValue;

}

//////////////////////////////////////////////////////////////////
service.getRootKey = function(key) {

    // key = String(key).split('[]')[0];

    return String(key).split('|')[0];

}

//////////////////////////////////////////////////////////////////



//Easy function to filter according to all specified criteria when in the front end
service.filter = function(items, options) {

    if (!options) {
        options = {};
    }

    //////////////////////////////////////

    var filterOptions;

    //////////////////////////////////////

    var searchKeywords = options.search ? String(options.search).toLowerCase().trim() : null;
    var searchPieces = (searchKeywords || '').split(' ');
    var startDate = options.startDate ? new Date(options.startDate) : null;
    var endDate = options.endDate ? new Date(options.endDate) : null;
    var filterConfig = options.filter;



    //////////////////////////////////////

    var activeFilters = service.activeFilters(filterConfig);
    var hasActiveFilters = (activeFilters && activeFilters.length);
    var hasSearchKeywords = (searchKeywords && searchKeywords.length);
    var hasDateBoundaries = (startDate && endDate);

    //////////////////////////////

    //No filters are active
    if (!hasActiveFilters && !hasSearchKeywords && !hasDateBoundaries) {
        return items;
    }

    //////////////////////////////

    return _.filter(items, function(item) {

        //There is filter criteria
        if (hasActiveFilters) {
            //Check if it matches the filters and if it doesn't
            var matchesFilters = service.filterGroupMatch(filterConfig, filterOptions, item);
            if (!matchesFilters) {
                return;
            }
        }

        /////////////////////////////////

        var searchIsCorrect;

        //Check if it matches the search keywords
        if (hasSearchKeywords) {

            //Get the title
            var itemTitle = String(item.title).trim().toLowerCase();
            var idString = String(item._id).trim().toLowerCase();

            //If the keyword string is an exact match for the id of the item
            var exactIDMatch = (searchKeywords == idString);
            if (exactIDMatch) {
                //Search is a match
                searchIsCorrect = true;
            } else {



                //If the title matches the keywords exactly
                var exactMatch = _.includes(itemTitle, searchKeywords);

                if (exactMatch) {
                    //We are all done here

                    searchIsCorrect = true;

                } else {

                    //Check if the the keywords matches
                    var keywordString = (item.keywords || []).join(' ');

                    //If there are keywords
                    if (keywordString.length) {

                        // console.log('We have keywords!', keywordString)

                        //Check if there is an exact match for keywords
                        var exactMatch = _.includes(keywordString, searchKeywords);

                        if (exactMatch) {
                            //We're done
                            searchIsCorrect = true;
                        } else {
                            //If it's a Multiword Match
                            var multiMatch = _.every(searchPieces, function(partial) {
                                return _.includes(itemTitle, partial) || _.includes(keywordString, partial);
                            })
                            // console.log('Is it a multimatch?', multimatch)

                            if (multiMatch) {
                                searchIsCorrect = true;
                            }
                        }
                    }

                    //////////////////////////////////////////

                    //Search is correct
                    if (!searchIsCorrect) {



                        function recursiveDeepSearch(entry) {

                            if (_.isString(entry)) {
                                return service.matchAnyString(searchKeywords, entry);
                            }

                            if (_.isArray(entry) || _.isObject(entry)) {
                                return _.some(entry, function(value) {
                                    return recursiveDeepSearch(value);
                                })
                            }

                        }




                        searchIsCorrect = recursiveDeepSearch(item);
                    }
                }
            }

            //////////////////////////////////////

            //If we have a search but the item doesn't match it
            //then finish and return false here
            if (!searchIsCorrect) {
                // ////console.log('Not match for', searchKeywords, row.title);
                return;
            }
        }

        //////////////////////////////

        if (hasDateBoundaries) {
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            //////////////////////

            var itemStartDate = new Date(row.startDate);
            itemStartDate.setHours(0, 0, 0, 0);

            var itemEndDate = new Date(row.endDate);
            itemEndDate.setHours(0, 0, 0, 0);

            if (itemEndDate < startDate) {
                return;
            }

            if (itemStartDate > endDate) {
                return;
            }
        }

        //////////////////////////////

        //We made it here so it must be a correct match
        return true;

    });

}

//////////////////////////////////////////////////////////////////

//Pass through
service.filterMatch = function(filter, filterOptions, item) {


    if (!filterOptions) {
        filterOptions = {};
    }

    if (filter.filters) {
        return service.filterGroupMatch(filter, filterOptions, item);
    }


    // console.log('FILTER', filter.key, filter, item)
    ////////////////////////////////////////

    var filterKey = filter.key; //.split('|')[0];
    var arrayDelimiter = '[]';




    if (_.includes(filterKey, arrayDelimiter)) {


        var splitPieces = filterKey.split(arrayDelimiter);
        var splitKey = splitPieces.shift();
        var splitParameters = splitPieces.join('[]');

        var newFilter = JSON.parse(JSON.stringify(filter));
        newFilter.key = splitParameters;
        var subItems = _.get(item, splitKey) || [];

        //////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////
        //////////////////////////////////////////////////////////

        // //Here we should check what kind of filter it is and whether to do a falsey/truthy check on the path
        if (isFalsey(newFilter.comparator)) {
            if (!subItems.length) {
                return true;
            }

            //Ensure that none of the sub items match
            return _.every(subItems, function(subItem) {
                return service.filterMatch(newFilter, filterOptions, subItem)
            });
        } else {

            if (!subItems.length) {
                return;
            }

            //Find as soon as there is a match
            var someMatch = _.some(subItems, function(subItem) {
                var isAMatch = service.filterMatch(newFilter, filterOptions, subItem)
                // console.log('sub item has a match', isAMatch, subItem)
                return isAMatch;
            });


            // console.log('IS MATCH WITH SUB ITEMS', someMatch)
            return someMatch
        }




        ////////////////////////////////////////////////


        // return _.filter(subItems, function(subItem) {
        //     var isMatch = service.filterMatch(newFilter, subItem)
        //     if(isMatch) {
        //         subItem._matchesFilter = true;
        //     }

        //     return isMatch;
        // }).length;
    }

    ////////////////////////////////////////

    var key = service.getRootKey(filterKey);

    if (key[0] == '.') {
        key = key.slice(1);
    }
    var mustMatchValue = filter.value;
    var mustMatchValue2 = filter.value2;




    ////////////////////////////////////////



    // console.log('ROOT KEY', key, filter.dataType, mustMatchValue, mustMatchValue2);
    // console.log('ROOT KEY', key, filter.dataType, mustMatchValue, mustMatchValue2, item);

    ////////////////////////////////////////

    if (filter.dataType == 'date' && filter.computedValue && filter.computedValue.length) {

        // console.log('DATE CHECKER', item, mustMatchValue, mustMatchValue2)
        var dynamicString = filter.computedValue;
        if (dynamicString == 'now') {
            mustMatchValue = new Date();
        } else {

            //Get the context date
            var contextDateInput = filterOptions.contextDate ? filterOptions.contextDate : new Date();

            //////////////////////////////////////////////////

            // if(_.startsWith(dynamicString.trim(), '-')) {
            //     dynamicString = `${dynamicString} ago`;
            // } else {
            //     ////console.log('In future')
            // }

            if (filterOptions.timezone) {
                var zone = moment.tz.zone(filterOptions.timezone);
                if (zone) {
                    var TimezoneAbbr = zone.abbr(contextDateInput);
                    dynamicString = `${dynamicString} ${TimezoneAbbr}`;
                }
            }

            //////////////////////////////////////////////////


            var timestamp;

            if (chrono) {
                timestamp = chrono.parseDate(dynamicString, contextDateInput);
            }

            //If it failed then use strtotime
            if (!timestamp) {

                //Create a new date from the relative date

                timestamp = new Date(contextDateInput).strtotime(dynamicString);
            } else {
                // ////console.log('Chrono', dynamicString, contextDateInput, timestamp);
            }

            //Use the timestamp as the value we need to match
            mustMatchValue = new Date(timestamp);



            // ////console.log('ComputedValue', TimezoneAbbr, filterOptions.timezone, filterOptions.contextDate, ':::', dynamicString, timestamp, mustMatchValue);
        }

    }

    ////////////////////////////////////////

    //Find the comparator
    var comparator = service.getComparator(filter.comparator || '==');
    var inputType = comparator.inputType;

    ////////////////////////////////////////


    if (!key || !key.length) {
        ////console.log('No Key!', key)
        return true;
    }




    //If we are a range type filter
    if (inputType == 'array') {

        // ////console.log('ARRAY?', inputType);
        //Get the second value
        var mustMatchValue = filter.values || [];

        //If we don't have a value 2 then return true
        if (!mustMatchValue || !mustMatchValue.length) {
            return true;
        }
    }

    ////////////////////////////////////////

    if (inputType != 'none') {

        // ////console.log('INPUT TYPE IS', inputType);
        //If we don't have a value yet then return true
        if (typeof mustMatchValue == 'undefined' || mustMatchValue === null) {
            return true;
        }
    }


    ////////////////////////////////////////

    //If we are a range type filter
    if (inputType == 'range' || inputType == 'daterange') {
        //If we don't have a value 2 then return true
        if (typeof mustMatchValue2 == 'undefined' || mustMatchValue2 === null) {
            return true;
        }
    }

    ////////////////////////////////////////

    //Get the actual value on the item
    var itemValue = _.get(item, key);

    // ////console.log('GET ITEM VALUE', key, itemValue);


    ////////////////////////////////////////

    var discriminatorDelimiter = '|';
    if (_.includes(filterKey, discriminatorDelimiter)) {

        ////////////////////////////////////////

        // if (_.startsWith(key, 'tags')) {
        //     //console.log('CHECK', inputType, key, item[key], mustMatchValue, mustMatchValue2)
        // }

        ////////////////////////////////////////
        var discriminatorPieces = filterKey.split(discriminatorDelimiter);
        var discriminatorKey = discriminatorPieces[0];
        var discriminator = discriminatorPieces[1];

        if (discriminator && key != 'tags') {


            itemValue = _.filter(itemValue, function(realm) {


                return realm.definition == discriminator || realm._discriminatorType == discriminator || realm._discriminator == discriminator;
            })


        }
    }


    // //console.log('TAGS CHECK', key, itemValue.length)

    ////////////////////////////////////////

    // if (inputType != 'none') {
    //     //If we don't have a value yet then return true
    //     if (typeof mustMatchValue == 'undefined' || mustMatchValue === null || mustMatchValue == '') {
    //         return;
    //     }
    // }

     ////////////////////////////////////////

    switch (filter.dataType) {
        case 'boolean':
            itemValue = service.convertToBoolean(itemValue);
            mustMatchValue = service.convertToBoolean(mustMatchValue);
            break;
        default:
            if (inputType != 'none') {
                //If we don't have a value yet then return true
                if (typeof mustMatchValue == 'undefined' || mustMatchValue === null || mustMatchValue == '') {
                    return;
                }
            }
            break;
    }





    ////////////////////////////////////////


    if (filter.criteria && filter.criteria.length) {

        var arraySourceKey = key.split('.length')[0];
        var arrayValue = _.get(item, arraySourceKey);


        // console.log('ARRAY', item.title, _.map(arrayValue,function(post) {return `${post.parent} - ${post._id}`}));

        //If there are items to filter
        //itemValue should be an array 
        if (arrayValue && arrayValue.length) {

            ////////////////////////////////////////


            //We need to filter the arrayValue array to match our criteria
            arrayValue = _.filter(arrayValue, function(entry) {

                // ////console.log('ARRAY VALUE', entry, discriminator);
                var val = service.filterMatch({ filters: filter.criteria }, filterOptions, entry);

                // if (entry._id == '5e798a7e5bf8a3465952d923') {
                //     ////console.log('FOUND IT', val, entry);
                // }
                return val;
            });

            ////console.log('FILTERED ARRAY VALUE', arrayValue)

            // ////console.log('CRITERIA KEY', arraySourceKey, key, itemValue.length)
            //console.log('cHECK MATCH FILTER', filter.sourceKey, itemValue.length);//, filter.criteria);
        } else {
            arrayValue = []
        }


        // //console.log('ARRAY CHECK', filter.criteria)

        // var keys = _.map(filter.criteria, 'key');

        // _.each(arrayValue, function(entry) {
        // 	entry.title = entry.title
        // })

        ////////////////////////////

        //Augment with the details
        if (!item._matchedFilters) {
            item._matchedFilters = {};
        }

        if (!item._matchedFilters[key]) {
            item._matchedFilters[key] = []; //{total:arrayValue.length, items:[]};
        }

        item._matchedFilters[key].push(arrayValue.slice(0, 100))

        ////////////////////////////

        if (_.endsWith(key, '.length')) {
            itemValue = arrayValue.length;
        } else {
            itemValue = arrayValue;
        }
    }



    ////////////////////////////////////////


    var itMatches = comparator.match(itemValue, mustMatchValue, mustMatchValue2, {
        source: item,
        key: key,
        timezone: filterOptions.timezone,
        contextDate: filterOptions.contextDate,
    });

    // if (itMatches && key == 'tags') {
    //     //console.log('CHECK IT MATCHES', item._id, item.title, itMatches, itemValue)
    //     // //console.log('CHECK IT MATCHES', item.title, item.track, itMatches, itemValue)
    // }


    ////////////////////////////////////////

    return itMatches;
}

///////////////////////////////


service.getComparatorWeight = function(key) {

    var weight = 0;

    //////////////////////////////////////////

    switch (key) {

        //Exact Comparators
        case '==':
        case '!=':
        case 'empty':
        case 'notempty':
            return 0;
            break;

            //Numeric Comparators
        case '>':
        case '<':
        case '!>':
        case '!<':
        case '>=':
        case '<=':
        case 'between':
        case 'notbetween':
            return 1;
            break;

            //String Comparators
        case 'startswith':
        case 'endswith':
        case 'doesnotstartwith':
        case 'doesnotendwith':
        case 'contains':
        case 'excludes':
            return 2
            break;

            //Array Comparators
        case 'in':
        case 'notin':
            return 3
            break;

            //Date Comparators
        case 'datesameday':
        case 'dateanniversary':
        case 'dateanniversarybetween':
        case 'dateanniversarynext':
        case 'dateanniversarypast':
        case 'datesameweek':
        case 'datesamemonth':
        case 'datesameyear':
        case 'datesameweekday':
        case 'datebefore':
        case 'dateafter':
        case 'datenotbefore':
        case 'datenotafter':
        case 'datebetween':
        case 'datenotbetween':
            return 4
            break;

            //Fuzzy Search Comparators
        case 'like':
            return 5
            break;
    }

    ///////////////////////////////////

    return weight;
}


function isFalsey(comparator) {
    switch (comparator) {
        case 'excludes':
        case 'doesnotstartwith':
        case 'doesnotendwith':
        case '!>':
        case '!<':
        case '!=':
        case 'notbetween':
        case 'notin':
        case 'empty':
        case 'datenotbetween':
        case 'datenotafter':
        case 'datenotbefore':
            return true;
            break;

    }
}

///////////////////////////////

function occurrences(string, substring) {

    var n = 0;
    var pos = 0;
    var l = substring.length;

    while (true) {

        pos = (string || '').indexOf(substring, pos);
        if (pos > -1) {
            n++;
            pos += l;
        } else {
            break;
        }
    }
    return (n);
}


service.allKeys = function(initFields, config) {

    // if (!confi) {
    //     return [];
    // }

    if (!initFields) {
        initFields = [];
    }


    var definitionFields = _.chain(config)
        .get('definition.fields')
        .map(function(field) {
            return Object.assign({}, field, {
                key: 'data.' + field.key,
            })
        })
        .value();

    //////////////////////////////////////////////////////////////////////////////////

    //Include filters that have been set on the definition
    var definitionFilters = _.chain(config)
        .get('definition.filters')
        .map(function(field) {
            return Object.assign({}, field)
        })
        .value();

    //////////////////////////////////////////////////////////////////////////////////

    //Include filters that have been set on the definition
    var dynamicFilters = _.chain(config)
        .get('definition.dynamicFilters')
        .map(function(field) {
            return Object.assign({}, field)
        })
        .value();

    //////////////////////////////////////////////////////////////////////////////////

    var typeFields = _.chain(config)
        .get('type.fields')
        .map(function(field) {
            return Object.assign({}, field)
        })
        .value();

    //////////////////////////////////////////////////////////////////////////////////

    var indexIterator = '0'; //0;


    //////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////

    function getFlattenedFields(array, trail, titles) {


        return _.chain(array)
            .map(function(field, key) {

                //Create a new object so we don't mutate
                var field = Object.assign({}, field);

                var returnValue = [];



                /////////////////////////////////////////

                //If there are sub fields
                if (field.fields && field.fields.length) {


                    if (field.asObject || field.directive == 'embedded') {
                        //Push the field itself
                        trail.push(field.key);
                        titles.push(field.title)

                        field.trail = trail.slice();
                        field.titles = titles.slice();

                        trail.pop();
                        titles.pop();
                        returnValue.push(field);


                        ///////////////////////////////

                        //Prepend the key to all lowed fields




                        if (field.maximum != 1) {
                            // trail.push(field.key + '[' + indexIterator + ']');
                            trail.push(field.key + '[]');
                            titles.push(field.title);
                        } else {
                            trail.push(field.key);
                            titles.push(field.title);
                        }
                    }

                    var fields = getFlattenedFields(field.fields, trail, titles);

                    if (field.asObject || field.directive == 'embedded') {
                        trail.pop()
                        titles.pop();
                    }
                    returnValue.push(fields);


                } else {
                    /////////////////////////////////////////

                    //Push the field key
                    trail.push(field.key);
                    titles.push(field.title);

                    field.trail = trail.slice();
                    field.titles = titles.slice();
                    trail.pop();
                    titles.pop();
                    returnValue.push(field);
                }



                /////////////////////////////////////////

                return returnValue;

            })
            .flattenDeep()
            .value();
    }

    //////////////////////////////////////////////////////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////////

    var detailSheetFields = [];

    if (config && config.details) {
        detailSheetFields = _.reduce(config.details, function(set, detailSheet) {

            // //Get all the flattened fields
            var flattened = getFlattenedFields(detailSheet.fields, [], []);

            //////////////////////////////////

            var mapped = _.chain(flattened)
                .map(function(field) {

                    if (field.type == 'group') {
                        return;
                    }

                    return {
                        title: detailSheet.title + ' - ' + field.titles.join(' > '),
                        key: `details.${detailSheet.definitionName}.items[].data.${field.trail.join('.')}`,
                        minimum: field.minimum,
                        maximum: field.maximum,
                        detail: detailSheet.definitionName,
                        type: field.type,
                    }
                })
                .compact()
                .value();



            //Add an 'existence' check for the _id
            mapped.unshift({
                title: detailSheet.title,
                // key: `details.${detailSheet.definitionName}.items[0].data.${field.trail.join('.')}`,
                key: `details.${detailSheet.definitionName}.items[]._id`,
                minimum: 0,
                maximum: 0,
                detail: detailSheet.definitionName,
                type: 'string',
            })

            //Add an 'existence' check for the _id
            mapped.unshift({
                title: `${detailSheet.title} - Number of sheets`,
                // key: `details.${detailSheet.definitionName}.items[0].data.${field.trail.join('.')}`,
                key: `details.${detailSheet.definitionName}.items.length`,
                minimum: 0,
                maximum: 0,
                detail: detailSheet.definitionName,
                type: 'integer',
            })

            //////////////////////////////////

            return set.concat(mapped);

        }, []);
    }

    //////////////////////////////////////////////////////////////////////////////////



    //////////////////////////////////////////////////////////////////////////////////

    // console.log('Filter all keys> ', definitionFilters, dynamicFilters, config);
    var fields = initFields.concat(typeFields, definitionFields, detailSheetFields, dynamicFilters, definitionFilters);

    //////////////////////////////////////////////////////////////////////////////////

    return _.chain(fields)
        .uniqBy(function(field) {
            return field.key;
        })
        .filter(function(field) {
            return field.type != 'object';
        })
        .orderBy('title')
        .value();



}



///////////////////////////////////////

function addValueToSet(values, entry) {

    //If it's not an object
    if (!entry._id && !entry.title && !entry.name && !entry.id) {
        return values[entry] = entry;
    }

    return values[entry._id || entry.title || entry.name || entry.id] = entry;
}

///////////////////////////////////////

service.getDeepValue = function(set, node, keyPath) {

    if (_.includes(keyPath, '[]')) {
        var splitPieces = keyPath.split('[]');
        var splitKey = splitPieces.shift();
        var subPath = splitPieces.join('[]');
        var subItems = _.get(node, splitKey) || [];
        return _.each(subItems, function(subItem) {
            service.getDeepValue(set, subItem, subPath)
        });
    }

    //Matching Value
    var value = _.get(node, keyPath);

    if (value == undefined || value == null || value == [] || value == '') {
        return;
    }

    ///////////////////////////////////////

    if (_.isArray(value)) {
        if (value.length) {
            _.each(value, function(v) {
                addValueToSet(set, v);
            })
        }
    } else {
        addValueToSet(set, value);
    }

}

//////////////////////////////////////////////////////////////

service.convertToBoolean = function(v) {
    switch (String(v).toLowerCase(v)) {
        case 'true':
        case 'yes':
        case 'y':
        case '1':
            return true;
            break;
        default:
            return false;
            break;
    }
}


//////////////////////////////////////////////////////////////

service.extractDeepValues = function(node, fieldKey) {
    var values = {};

    //Get the deep value
    // console.log('get deep value', node, fieldKey);
    service.getDeepValue(values, node, fieldKey);

    //////////////////////////////////////////

    return _.values(values);
}

//////////////////////////////////////////////////////////////


export default service;