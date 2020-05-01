import _ from 'lodash';
import moment from 'moment';
import stringSimilarity from 'string-similarity';

// const stringSimilarity = () => import('string-similarity');


//////////////////////////////////////////////////////////////////////

var FilterService = {};

//////////////////////////////////////////////////////////////////////

FilterService.activeFilters = function(config) {

    var memo = [];
    getActiveFilter(config, memo);

    return memo;

    ////////////////////////////

    function getActiveFilter(block, memo) {

        var isValid = FilterService.isValidFilter(block);
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

FilterService.activeFilterRows = function(config) {

    return _.filter(FilterService.activeFilters, function(row) {
        return row.comparator && row.comparator.length;
    })
}


FilterService.activeFilterKeys = function(config) {
    var keys = _.chain(FilterService.activeFilters(config))
        .map(function(entry) {
            if (!entry || !entry.key) {
                return;
            }

            return FilterService.getRootKey(entry.key);
        })
        .compact()
        .uniq()
        .value();

    return keys;
}

//////////////////////////////////////////////////////////////////////


FilterService.activeFilterCriteriaString = function(config) {


    var criteriaValue = _.chain(FilterService.activeFilters(config))
        .map(function(block) {

            if (!block.criteria || !block.criteria.length) {
                return;
            }

            //////////////////////////

            var activeCriteria = FilterService.activeFilters({ filters: block.criteria });

            if (!activeCriteria || !activeCriteria.length) {
                return;
            }

            //////////////////////////


            return FilterService.getFilterChangeString({ filters: activeCriteria });
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

    return criteriaValue;

}





//////////////////////////////////////////////////////////////////////


FilterService.activeFilterValues = function(config) {

    var values = _.chain(FilterService.activeFilters(config))
        .map(function(block) {

            var all = [];
            var comparator = FilterService.getComparator(block.comparator);

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

                    all.push(block.computedValue, block.value, block.value2);
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



    return values;

}

FilterService.activeFilterComparators = function(config) {
    var memo = [];
    getActiveFilterComparator(config, memo);
    return memo;

    ////////////////////////////


    function getActiveFilterComparator(block, memo) {

        var isValid = FilterService.isValidFilter(block);
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

FilterService.activeFilterOperators = function(config) {
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
                return FilterService.isValidFilter(filter);
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


FilterService.getFilterChangeString = function(config) {

    //Put all this together so we only refilter when we actually need to
    //each of these will only return if the filter is valid and actually changes
    //effects the results, without this step the table will update everytime you change the filters
    var string = [
        FilterService.activeFilterKeys(config).join(', '),
        FilterService.activeFilterValues(config).join(', '),
        FilterService.activeFilterCriteriaString(config).join(', '),
        FilterService.activeFilterComparators(config).join(', '),
        FilterService.activeFilterOperators(config).join(', '),
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
            return String(input._id);
        }

        if (input._external) {
            return String(input._external);
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

    if (!_.isObject(input)) {
        return [String(input).toLowerCase()];
    }

    if (_.isArray(input)) {
        return _.flatten(getAllStringMatches(input, includeIDs))
    }

    if (includeIDs) {
        if (input._id && input._id.length) {
            matches.push(input._id);
        }

        if (input._external && input._external.length) {
            matches.push(input._external);
        }
    }

    if (input.title && input.title.length) {
        matches.push(String(input.title).toLowerCase());
    }

    if (input.name && input.name.length) {
        matches.push(String(input.name).toLowerCase());
    }



    return matches;
}

//////////////////////////////////////////////////////////////////////

function isBetween(input, from, to) {

    var startFloat = parseFloat(from);
    var endFloat = parseFloat(to);
    var checkFloat = parseFloat(input);

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
}


///////////////////////////////////


FilterService.matchAnyString = function(keywords, row) {

    var values = _.values(row);
    var string = getString(keywords);
    return _.some(values, function(input) {
        return _.includes(getString(input), string)
    })
}

///////////////////////////////////

FilterService.isSimilar = function(input, mustMatchValue, options) {

    if (!options) {
        options = {};
    }


    // var stringSimilarity = () => import('string-similarity');

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
    var matchAny = getAllStringMatches(input, true);

    var rangeAsString = getString(range, true);

    if (matchAny == rangeAsString) {
        return true;
    }


    var isMatch = _.includes(matchAny, rangeAsString);

    return isMatch
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

    var moment1 = moment.tz(input, timezone);
    var moment2 = moment.tz(range, timezone);

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

            break;
        case 'week':
            matched = moment1.format('W YYYY') == moment2.format('W YYYY');

            break;
        case 'month':
            matched = moment1.format('M YYYY') == moment2.format('M YYYY');

            break;
        case 'year':
            matched = moment1.format('YYYY') == moment2.format('YYYY');
            break;
        case 'dateanniversary':
            matched = moment1.format('D MMM') == moment2.format('D MMM');
            break;
        case 'dateanniversarymonth':
            matched = moment1.format('MMM') == moment2.format('MMM');
            break;
            // case 'weekday':
            //     matched = moment(date1).format('dddd') == moment(date2).format('dddd');
            // break;
        case 'before':
            matched = date1.getTime() < date2.getTime();
            break;
        case 'after':
            matched = date1.getTime() >= date2.getTime();
            break;
        case 'next':
            //If the date is earlier than now
            if (date1 < now) {
                matched = false;
            } else {
                matched = date1.getTime() < date2.getTime()
            }
            break;
        case 'past':
            //If the date is later than now
            if (date1 > now) {
                matched = false;
            } else {
                matched = date1.getTime() >= date2.getTime()
            }
            break;
    }

    ///////////////////////////////////////////////////

    return matched;
}

///////////////////////////////

FilterService.comparators = [];

///////////////////////////////

//Date Comparators
FilterService.comparators.push({
    title: 'Is on day ',
    operator: 'datesameday',
    match(input, mustMatchValue) {

        if (_.isArray(input)) {
            return _.some(input, function(i) {
                return dateCompare(i, mustMatchValue, 'date');
            });
        } else {
            return dateCompare(input, mustMatchValue, 'date');
        }

    },
    // dateDisplayFormat:'D MMM YYYY',
    restrict: [
        'date',
    ],
})

FilterService.comparators.push({
    title: 'Anniversary Date',
    operator: 'dateanniversary',
    match(input, mustMatchValue) {

        if (_.isArray(input)) {
            return _.some(input, function(i) {
                return dateCompare(i, mustMatchValue, 'dateanniversary');
            });
        } else {
            return dateCompare(input, mustMatchValue, 'dateanniversary');
        }

    },
    // dateDisplayFormat: 'YYYY',
    restrict: [
        'date',
    ],

})



FilterService.comparators.push({
    title: 'Anniversary is in the next',
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
                return dateCompare(i, mustMatchValue, 'dateanniversarynext');
            });
        } else {
            return dateCompare(input, mustMatchValue, 'dateanniversarynext');
        }
    },
    inputType: 'datemeasure',
    restrict: [
        'date',
    ],
})



FilterService.comparators.push({
    title: 'Anniversary is in the last',
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
                return dateCompare(i, mustMatchValue, 'dateanniversarypast');
            });
        } else {
            return dateCompare(input, mustMatchValue, 'dateanniversarypast');
        }
    },
    inputType: 'datemeasure',
    restrict: [
        'date',
    ],
})



// FilterService.comparators.push({
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

FilterService.comparators.push({
    title: 'Anniversary is Between',
    operator: 'dateanniversarybetween',
    match(input, mustMatchValue1, mustMatchValue2) {

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




// FilterService.comparators.push({
//     title: 'Anniversary Month',
//     operator: 'dateanniversarymonth',
//     match(input, mustMatchValue) {
//         // console.log('TEST MONTH', mustMatchValue);

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
FilterService.comparators.push({
    title: 'Is same week as',
    operator: 'datesameweek',
    match(input, mustMatchValue) {

        if (_.isArray(input)) {
            return _.some(input, function(i) {
                return dateCompare(i, mustMatchValue, 'week');
            });
        } else {
            return dateCompare(input, mustMatchValue, 'week');
        }

    },
    dateDisplayFormat: '[Wk]W YYYY',
    restrict: [
        'date',
    ],
    inputType: 'array',
})

FilterService.comparators.push({
    title: 'Is same month as',
    operator: 'datesamemonth',
    match(input, mustMatchValue) {

        //     match(input, mustMatchValue) {

        //     var mustMatchString = String(mustMatchValue);

        //     // console.log('Check date input', input);


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
                return dateCompare(i, mustMatchValue, 'month');
            });
        } else {
            return dateCompare(input, mustMatchValue, 'month');
        }

    },
    dateDisplayFormat: 'MMM YYYY',
    restrict: [
        'date',
    ],
})

FilterService.comparators.push({
    title: 'Is same year as',
    operator: 'datesameyear',
    match(input, mustMatchValue) {

        if (_.isArray(input)) {
            return _.some(input, function(i) {
                return dateCompare(i, mustMatchValue, 'year');
            });
        } else {
            return dateCompare(input, mustMatchValue, 'year');
        }

    },
    dateDisplayFormat: 'YYYY',
    restrict: [
        'date',
    ],
})
/**/

FilterService.comparators.push({
    title: 'Is weekday',
    operator: 'datesameweekday',
    match(input, mustMatchValue) {

        var mustMatchString = String(mustMatchValue);

        // console.log('Check date input', input);


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

FilterService.comparators.push({
    title: 'Is before',
    operator: 'datebefore',
    match(input, mustMatchValue) {
        return dateCompare(input, mustMatchValue, 'before');
    },
    restrict: [
        'date',
    ],
})


FilterService.comparators.push({
    title: 'Is after',
    operator: 'dateafter',
    match(input, mustMatchValue) {
        return dateCompare(input, mustMatchValue, 'after');
    },
    restrict: [
        'date',
    ],
})


FilterService.comparators.push({
    title: 'Is not before',
    operator: 'datenotbefore',
    match(input, mustMatchValue) {
        return !dateCompare(input, mustMatchValue, 'before');
    },
    restrict: [
        'date',
    ],
})


FilterService.comparators.push({
    title: 'Is not after',
    operator: 'datenotafter',
    match(input, mustMatchValue) {
        return !dateCompare(input, mustMatchValue, 'after');
    },
    restrict: [
        'date',
    ],
})

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

FilterService.comparators.push({
    title: 'Is in the next',
    operator: 'datenext',
    // match(input, mustMatchValue) {
    //     return dateCompare(input, mustMatchValue, 'before');
    // },
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
                return dateCompare(i, mustMatchValue, 'next');
            });
        } else {
            return dateCompare(input, mustMatchValue, 'next');
        }
    },
    inputType: 'datemeasure',
    restrict: [
        'date',
    ],
})


FilterService.comparators.push({
    title: 'Is in the last',
    operator: 'datepast',
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
                return dateCompare(i, mustMatchValue, 'past');
            });
        } else {
            return dateCompare(input, mustMatchValue, 'past');
        }
    },
    inputType: 'datemeasure',
    restrict: [
        'date',
    ],
})



////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////

FilterService.comparators.push({
    title: 'Is between',
    operator: 'datebetween',
    match(input, mustMatchValue1, mustMatchValue2) {
        var checkDate = new Date(input);
        checkDate.setHours(0, 0, 0, 0);

        var date1 = new Date(mustMatchValue1)
        date1.setHours(0, 0, 0, 0);

        var date2 = new Date(mustMatchValue2)
        date2.setHours(0, 0, 0, 0);

        return isBetween(checkDate.getTime(), date1.getTime(), date2.getTime());
    },
    restrict: [
        'date',
    ],
    inputType: 'daterange',
})

FilterService.comparators.push({
    title: 'Is not between',
    operator: 'datenotbetween',
    match(input, mustMatchValue1, mustMatchValue2) {
        var checkDate = new Date(input);
        checkDate.setHours(0, 0, 0, 0);

        var date1 = new Date(mustMatchValue1)
        date1.setHours(0, 0, 0, 0);

        var date2 = new Date(mustMatchValue2)
        date2.setHours(0, 0, 0, 0);

        return !isBetween(checkDate.getTime(), date1.getTime(), date2.getTime());
    },
    restrict: [
        'date',
    ],
    inputType: 'daterange',
})



///////////////////////////////
///////////////////////////////
///////////////////////////////


FilterService.comparators.push({
    title: 'Is one of',
    operator: 'in',
    match(input, mustMatchValue) {


        if (_.isArray(input)) {

            //Check if any match
            return !_.some(input, function(i) {


                return isIn(i, mustMatchValue);
            });
        } else {

            var matches = isIn(input, mustMatchValue);

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

FilterService.comparators.push({
    title: 'Is not one of',
    operator: 'notin',
    match(input, mustMatchValue) {
        if (_.isArray(input)) {
            return _.some(input, function(i) {
                return !isIn(i, mustMatchValue);
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



FilterService.comparators.push({
    title: 'Is ',
    operator: '==',

    match(input, mustMatchValue) {
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

FilterService.comparators.push({
    title: 'Is not',
    operator: '!=',
    positive: false,
    match(input, mustMatchValue) {
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

FilterService.comparators.push({
    title: 'Starts with',
    operator: 'startswith',

    match(input, mustMatchValue) {
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



FilterService.comparators.push({
    title: 'Ends with',
    operator: 'endswith',

    match(input, mustMatchValue) {
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


FilterService.comparators.push({
    title: 'Is similar to',
    operator: 'like',

    match(input, mustMatchValue, mustMatchValue2, options) {

        if (_.isArray(input)) {
            return _.some(input, function(i) {
                return FilterService.isSimilar(i, mustMatchValue);
            });
        } else {
            return FilterService.isSimilar(input, mustMatchValue);
        }
    },
    restrict: ['string'],
})

FilterService.comparators.push({
    title: 'Contains characters',
    operator: 'contains',

    match(input, mustMatchValue) {
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

FilterService.comparators.push({
    title: 'Does not contain characters',
    operator: 'excludes',
    match(input, mustMatchValue) {
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


FilterService.comparators.push({
    title: 'Is greater than',
    operator: '>',
    match(input, mustMatchValue) {
        return parseFloat(input) > parseFloat(mustMatchValue);
    },
    restrict: [
        'number',
        'integer',
        'decimal',
        'float',
    ],
})



FilterService.comparators.push({
    title: 'Is less than',
    operator: '<',
    match(input, mustMatchValue) {
        return parseFloat(input) < parseFloat(mustMatchValue);
    },
    restrict: [

        'number',
        'integer',
        'decimal',
        'float',
    ],
})




FilterService.comparators.push({
    title: 'Is greater than or equal to',
    operator: '>=',
    match(input, mustMatchValue) {
        return parseFloat(input) >= parseFloat(mustMatchValue);
    },
    restrict: [

        'number',
        'integer',
        'decimal',
        'float',
    ],
})

FilterService.comparators.push({
    title: 'Is less than or equal to',
    operator: '<=',
    match(input, mustMatchValue) {
        return parseFloat(input) <= parseFloat(mustMatchValue);
    },
    restrict: [

        'number',
        'integer',
        'decimal',
        'float',
    ],
})


FilterService.comparators.push({
    title: 'Is not greater than',
    operator: '!>',
    match(input, mustMatchValue) {

        if (!options) {
            options = {}
        }
        return !(parseFloat(input) > parseFloat(mustMatchValue));
    },
    restrict: [
        'number',
        'integer',
        'decimal',
        'float',
    ],
})


FilterService.comparators.push({
    title: 'Is not less than',
    operator: '!<',
    match(input, mustMatchValue) {
        return !(parseFloat(input) < parseFloat(mustMatchValue));
    },
    restrict: [

        'number',
        'integer',
        'decimal',
        'float',
    ],
})



FilterService.comparators.push({
    title: 'Is between',
    operator: 'between',
    match(input, mustMatchValue1, mustMatchValue2) {
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


FilterService.comparators.push({
    title: 'Is not between',
    operator: 'notbetween',
    match(input, mustMatchValue1, mustMatchValue2) {
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

FilterService.comparators.push({
    title: 'Is empty',
    operator: 'empty',
    match(input, mustMatchValue) {
        return isEmpty(input);
    },
    inputType: 'none',
})

FilterService.comparators.push({
    title: 'Is not empty',
    operator: 'notempty',
    match(input, mustMatchValue) {
        return !isEmpty(input);
    },
    inputType: 'none',
})



FilterService.comparators.push({
    title: 'Does not start with',
    operator: 'doesnotstartwith',
    match(input, mustMatchValue) {
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

FilterService.comparators.push({
    title: 'Does not end with',
    operator: 'doesnotendwith',
    match(input, mustMatchValue) {
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

FilterService.comparatorLookup = {};
FilterService.comparatorTypeLookup = {};

///////////////////////////////

//Loop through each available comparator
_.each(FilterService.comparators, function(comparator) {

    //map each comparator
    FilterService.comparatorLookup[comparator.operator] = comparator;

    //Find any restrictions for this comparator
    var restrictTypes = comparator.restrict || [];

    //If there are none, then it's available to all types
    if (!restrictTypes.length) {
        restrictTypes = allTypes;
    }

    //And map to each type it's restricted for
    _.each(restrictTypes, function(type) {

        var existing = FilterService.comparatorTypeLookup[type];

        if (!existing) {
            existing = FilterService.comparatorTypeLookup[type] = [];
        }

        //Add the comparator to the list
        existing.push(comparator);

    })

});

///////////////////////////////


//Quick fast way to retrieve the comparator
FilterService.getComparator = function(operator) {
    return FilterService.comparatorLookup[operator]
}

//////////////////////////////////////////////////////////////////

FilterService.getComparatorsForType = function(type) {
    //Return the matches or just all comparators
    return FilterService.comparatorTypeLookup[type] || FilterService.comparators;
}

////////////////////////////////////////////////////////

FilterService.isValidFilter = function(block) {

    if (block.operator) {
        return _.some(block.filters, FilterService.isValidFilter);
    }
    ////////////////////////////////////////////////////////

    var comparator = FilterService.getComparator(block.comparator);
    if (!comparator) {
        return;
    }




    ////////////////////////////////////////////////////////

    var key = FilterService.getRootKey(block.key);
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
            //It's a date by process of elimination

            if (block.computedValue) {
                return true;
            }

            if (!block.value || !_.isDate(new Date(block.value))) {
                return;
            }
            break;

    }


    return true;
}


//////////////////////////////////////////////////////////////////

FilterService.filterGroupMatch = function(filterGroup, item) {

    //If it's a group

    var operator = filterGroup.operator;
    var returnValue;


    var validFilters = _.filter(filterGroup.filters, FilterService.isValidFilter);

    if (validFilters && validFilters.length) {

        switch (operator) {
            case 'or':
                returnValue = _.some(validFilters, function(filterBlock) {
                    var wasMatch = FilterService.filterMatch(filterBlock, item)
                    return wasMatch;
                })
                break;
            case 'and':
            default:
                returnValue = _.every(validFilters, function(filterBlock) {

                    var wasMatch = FilterService.filterMatch(filterBlock, item)
                    return wasMatch;
                })
                break;
        }

    }

    return returnValue;

}

//////////////////////////////////////////////////////////////////

FilterService.getRootKey = function(key) {
    return String(key).split('|')[0];

}

//////////////////////////////////////////////////////////////////


// FilterService.filter(cards, {
//     filter:filterConfig,
//     startDate:'',
//     endDate:'',
//     search:'Sophia',
// })


//Easy function to filter according to all specified criteria when in the front end
FilterService.filter = function(items, options) {

    if (!options) {
        options = {};
    }

    //////////////////////////////////////

    var searchKeywords = options.search ? String(options.search).toLowerCase().trim() : null;
    var searchPieces = (searchKeywords || '').split(' ');
    var startDate = options.startDate ? new Date(options.startDate) : null;
    var endDate = options.endDate ? new Date(options.endDate) : null;
    var filterConfig = options.filter;

    //////////////////////////////////////

    var activeFilters = FilterService.activeFilters(filterConfig);
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
            var matchesFilters = FilterService.filterGroupMatch(filterConfig, item);
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

                            if (multiMatch) {
                                searchIsCorrect = true;
                            }

                            // return FilterService.matchAnyString(searchKeywords, item);
                        }
                    }
                }
            }

            //////////////////////////////////////

            //If we have a search but the item doesn't match it
            //then finish and return false here
            if (!searchIsCorrect) {
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
FilterService.filterMatch = function(filter, item) {
    if (filter.filters) {
        return FilterService.filterGroupMatch(filter, item);
    }



    var key = FilterService.getRootKey(filter.key);
    var mustMatchValue = filter.value;
    var mustMatchValue2 = filter.value2;

    ////////////////////////////////////////

    if (filter.computedValue && filter.computedValue.length) {
        mustMatchValue = filter.computedValue;
    }

    ////////////////////////////////////////

    //Find the comparator
    var comparator = FilterService.getComparator(filter.comparator || '==');
    var inputType = comparator.inputType;

    ////////////////////////////////////////

    if (!key || !key.length) {
        return true;
    }


    ////////////////////////////////////////

    //If we are a range type filter
    if (inputType == 'array') {

        //Get the second value
        var mustMatchValue = filter.values || [];

        //If we don't have a value 2 then return true
        if (!mustMatchValue || !mustMatchValue.length) {
            return true;
        }
    }

    ////////////////////////////////////////

    if (inputType != 'none') {

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

    ////////////////////////////////////////

    if (inputType != 'none') {
        //If we don't have a value yet then return true
        if (typeof mustMatchValue == 'undefined' || mustMatchValue === null || mustMatchValue == '') {
            return;
        }
    }


    ////////////////////////////////////////

    //Return if it matches


    var itMatches = comparator.match(itemValue, mustMatchValue, mustMatchValue2, {
        source: item,
        key: key,
    });



    return itMatches;
}

///////////////////////////////
///////////////////////////////

FilterService.allKeys = function(initFields, config) {

    if (!config) {
        return [];
    }

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

    var detailSheetFields = _.reduce(config.details, function(set, detailSheet) {

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

    //////////////////////////////////////////////////////////////////////////////////

    var fields = initFields.concat(typeFields, definitionFields, detailSheetFields);

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

///////////////////////////////

export default FilterService;