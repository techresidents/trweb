define(/** @exports core/date */[
    'globalize',
    'core/base',
    'core/iter'

], function(
    Globalize,
    base,
    iter) {

    WEEKDAY = {
        MON: 0,
        TUE: 1,
        WED: 2,
        THU: 3,
        FRI: 4,
        SAT: 5,
        SUN: 6
    };

    MONTH = {
        JAN: 0,
        FEB: 1,
        MAR: 2,
        APR: 3,
        MAY: 4,
        JUN: 5,
        JUL: 6,
        AUG: 7,
        SEP: 8,
        OCT: 9,
        NOV: 10,
        DEC: 11
    };

    

    var isLeapYear = function(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    };

    var getDaysInMonth = function(year, month) {
        switch(month) {
            case MONTH.FEB:
                return isLeapYear(year) ? 29 : 28;
            case MONTH.JUN:
            case MONTH.SEP:
            case MONTH.NOV:
            case MONTH.APR:
                return 30;
            default:
                return 31;
        }
    };

    var Interval = base.Base.extend(
    /** @lends module:core/date~Interval.prototype */ { 
        
        /**
         * Interval constructor.
         * @constructs
         * @augments module:core/base~Base
         * @param {number} years Number of years
         * @param {number} [months] Number of months
         * @param {number} [days] Number of  days
         * @param {number} [hours] Number of hours
         * @param {number} [minutes] Number of minutes
         * @param {number} [seconds] Number of seconds
         * @param {number} [milliseconds] Number of milliseconds
         * @classdesc
         * Interval which can be added to {@link module:core/date~Date}
         * and {@link module:core/date~DateTime} objects through
         * their add() methods.
         * <br><br>
         * Note that subtraction is possible through negative params.
         */
        initialize: function(years, months, days, hours, minutes, seconds) {
            this.years = years || 0;
            this.months = months || 0;
            this.days = days || 0;
            this.hours = hours || 0;
            this.minutes = minutes || 0;
            this.seconds = seconds || 0;
        },

        /**
         * Compare to other Interval object.
         * @param {module:core/date~Interval} Interval object
         * @returns {boolean} true if equal, false otherwise.
         */
        equals: function(other) {
            if(!other) {
                return false;
            }

            return other.years === this.years &&
                   other.months === this.months &&
                   other.days === this.days &&
                   other.hours === this.hours &&
                   other.minutes === this.minutes &&
                   other.seconds === this.seconds;
        },

        /**
         * Add interval object.
         * @param {module:core/date~Interval} interval
         */
        add: function(interval) {
            this.years += interval.years;
            this.months += interval.months;
            this.days += interval.days;
            this.hours += interval.hours;
            this.minutes += interval.minutes;
            this.seconds += interval.seconds;
        }
    });

    var DateDate = base.Base.extend(
    /** @lends module:core/date~Date.prototype */ {

        /**
         * Date constructor.
         * @constructs
         * @augments module:core/base~Base
         * @param {number|object} year Year number or Date object.
         * @param {number} [month] Month typically (0-11)
         * @param {number} [date] Date typically (1-31)
         * @classdesc
         * Date class conforming to native Date inteface plus more.
         */
        initialize: function(year, month, date) {
            if(typeof year === 'number') {
                this.date = new Date(year, month || 0, date || 1);
            } else if(typeof year === 'object') {
                this.date = new Date(year.getFullYear(), year.getMonth(), year.getDate());
            } else {
                this.date = new Date(Date.now());
                this.date.setHours(0);
                this.date.setMinutes(0);
                this.date.setSeconds(0);
                this.date.setMilliseconds(0);
            }
        },

        /**
         * Clone date object.
         * @returns {module:core/date~Date} New date object
         */
        clone: function() {
            return new DateDate(this.date);
        },

        /**
         * Compare to other Date object.
         * @param {Date|module:core/date~Date} Date object to compare.
         * @returns {boolean} True if dates are equal, false otherwise.
         */
        equals: function(other) {
            if(!other) {
                return false;
            }
            return other.getFullYear() === this.getFullYear() &&
                   other.getMonth() === this.getMonth() &&
                   other.getDate() === this.getDate();
        },
        
        /**
         * Format date with Globalize.
         * <br>
         * See {@link https://github.com/jquery/globalize#dates} for formats.
         * @param {string} fmt Globalize format string.
         * @returns {string} Formatted date string.
         */
        format: function(fmt) {
            return Globalize.format(this.date, fmt);
        },
        
        /**
         * @returns {number} Four digit year.
         */
        getFullYear: function() {
            return this.date.getFullYear();
        },

        /**
         * @returns {number} Two digit year.
         */
        getYear: function() {
            return this.date.getYear();
        },

        /**
         * @returns {number} Month number (0-11)
         */
        getMonth: function() {
            return this.date.getMonth();
        },

        /**
         * @returns {number} Date number (1-31)
         */
        getDate: function() {
            return this.date.getDate();
        },

        /**
         * @returns {number} Hours number (0-23)
         */
        getHours: function() {
            return this.date.getHours();
        },

        /**
         * @returns {number} Minutes number (0-59)
         */
        getMinutes: function() {
            return this.date.getMinutes();
        },

        /**
         * @returns {number} Seconds number (0-59)
         */
        getSeconds: function() {
            return this.date.getSeconds();
        },

        /**
         * @returns {number} Milliseconds number (0-999)
         */
        getMilliseconds: function() {
            return this.date.getMilliseconds();
        },

        /**
         * @returns {number} Number of milliseconds since Jan 1, 1970.
         */
        getTime: function() {
            return this.date.getTime();
        },

        /**
         * @returns {number} Day of the week (0-6)
         */
        getDay: function() {
            return this.date.getDay();
        },

        /**
         * @returns {number} Four digit year according to UTC.
         */
        getUTCFullYear: function() {
            return this.date.getUTCFullYear();
        },

        /**
         * @returns {number} Two digit year according to UTC.
         */
        getUTCYear: function() {
            return this.date.getUTCYear();
        },

        /**
         * @returns {number} Month (0-11) according to UTC.
         */
        getUTCMonth: function() {
            return this.date.getUTCMonth();
        },

        /**
         * @returns {number} Date (1-31) according to UTC.
         */
        getUTCDate: function() {
            return this.date.getUTCDate();
        },

        /**
         * @returns {number} Hours (0-23) according to UTC.
         */
        getUTCHours: function() {
            return this.date.getUTCHours();
        },

        /**
         * @returns {number} Minutes (0-59) according to UTC.
         */
        getUTCMinutes: function() {
            return this.date.getUTCMinutes();
        },

        /**
         * @returns {number} Seconds (0-59) according to UTC.
         */
        getUTCSeconds: function() {
            return this.date.getUTCSeconds();
        },

        /**
         * @returns {number} Milliseconds (0-999) according to UTC.
         */
        getUTCMilliseconds: function() {
            return this.date.getUTCMilliseconds();
        },

        /**
         * @returns {number} Day of the week (0-6) according to UTC.
         */
        getUTCDay: function() {
            return this.date.getUTCDay();
        },

        /**
         * @param {number} value Four digit year
         */
        setFullYear: function(value) {
            this.date.setFullYear(value);
        },

        /**
         * @param {number} value Month
         */
        setMonth: function(value) {
            this.date.setMonth(value);
        },

        /**
         * @param {number} value Date
         */
        setDate: function(value) {
            this.date.setDate(value);
        },

        /**
         * @param {number} value Hours
         */
        setHours: function(value) {
            this.date.setHours(value);
        },

        /**
         * @param {number} value Minutes
         */
        setMinutes: function(value) {
            this.date.setMinutes(value);
        },

        /**
         * @param {number} value Seconds
         */
        setSeconds: function(value) {
            this.date.setSeconds(value);
        },

        /**
         * @param {number} value Millseconds
         */
        setMilliseconds: function(value) {
            this.date.setMillieconds(value);
        },

        /**
         * @param {number} value Four digit year
         */
        setUTCFullYear: function(value) {
            this.date.setUTCFullYear(value);
        },

        /**
         * @param {number} value Month
         */
        setUTCMonth: function(value) {
            this.date.setUTCMonth(value);
        },

        /**
         * @param {number} value Date
         */
        setUTCDate: function(value) {
            this.date.setUTCDate(value);
        },

        /**
         * @param {number} value Hours
         */
        setUTCHours: function(value) {
            this.date.setUTCHours(value);
        },

        /**
         * @param {number} value Minutes
         */
        setUTCMinutes: function(value) {
            this.date.setUTCMinutes(value);
        },

        /**
         * @param {number} value Seconds
         */
        setUTCSeconds: function(value) {
            this.date.setUTCSeconds(value);
        },

        /**
         * @param {number} value Milliseconds
         */
        setUTCMilliseconds: function(value) {
            this.date.setUTCMilliseconds(value);
        },

        /**
         * Add interval to Date object.
         * @param {module:core/date~Interval} Interval
         */
        add: function(interval) {
            if(interval.years || interval.months) {
                var month = this.getMonth() + interval.months + interval.years * 12;
                var year = this.getFullYear() + Math.floor(month / 12);
                month %= 12;
                if(month < 0) {
                    month += 12;
                }

                var daysInTargetMonth = getDaysInMonth(year, month);
                var date = Math.min(daysInTargetMonth, this.getDate());

                //avoid rollover
                this.setDate(1);
                this.setFullYear(year);
                this.setMonth(month);
                this.setDate(date);
            }

            if(interval.days) {
                // use noon to avoid day off by 1 due to daylight savings
                var noon = new Date(this.getFullYear(), this.getMonth(), this.getDate(), 12);
                var result = new Date(noon.getTime() + interval.days * 86400000);
                
                //avoid rollover
                this.setDate(1);
                this.setFullYear(result.getFullYear());
                this.setMonth(result.getMonth());
                this.setDate(result.getDate());
            }

            return this;
        },

        /**
         * @returns {string} date string
         */
        toDateString: function() {
            return this.date.toDateString();
        },

        /**
         * @returns {string} GMT date string
         */
        toGMTString: function() {
            return this.date.toGMTString();
        },

        /**
         * @returns {string} ISO date string
         */
        toISOString: function() {
            return this.date.toISOString();
        },

        /**
         * @returns {string} JSON date string
         */
        toJSON: function() {
            return this.date.toJSON();
        },

        /**
         * @returns {string} Locale date string
         */
        toLocaleDateString: function() {
            return this.date.toLocaleString();
        },

        /**
         * @returns {string} Locale time string
         */
        toLocaleTimeString: function() {
            return this.date.toLocaleTimeString();
        },

        /**
         * @returns {string} Date string
         */
        toString: function() {
            return this.date.toString();
        },

        /**
         * @returns {string} Time string
         */
        toTimeString: function() {
            return this.date.toTimeString();
        },

        /**
         * @returns {string} UTC date string
         */
        toUTCString: function() {
            return this.date.toUTCString();
        },

        /**
         * @returns {number} Milliseconds since Jan 1, 1970 according to UTC.
         */
        UTC: function() {
            return this.date.UTC();
        },

        /**
         * @returns {number} Milliseconds since Jan 1, 1970 according to UTC.
         */
        valueOf: function() {
            return this.date.valueOf();
        }
    }, /** @lends module:core/date~Date */ {

        /**
         * Create a Date object from a Unix timestamp.
         * @param {number} timetsamp Unix timestamp in seconds.
         * @returns {module:core/date~Date}
         */
        fromTimestamp: function(timestamp) {
            var date = new Date(0);
            date.setUTCSeconds(timestamp);
            return new DateDate(date);
        }
    });

    var DateTime = DateDate.extend(
    /** @lends module:core/date~DateTime.prototype */{

        /**
         * DateTime constructor.
         * @constructs
         * @augments module:core/date~Date
         * @param {number|object} year Year number or Date object.
         * @param {number} [month] Month typically (0-11)
         * @param {number} [date] Date integer typically (1-31)
         * @param {number} [hours] Hours typically (0-23)
         * @param {number} [minutes] Minutes typically (0-59)
         * @param {number} [seconds] Minutes typically (0-59)
         * @param {number} [milliseconds] Milliseconds typically (0-999)
         * @classdesc
         * DateTime class which implements native Date interface plus more.
         */
        initialize: function(year, month, date, hours, minutes, seconds, milliseconds) {
            if(typeof year === 'number') {
                this.date = new Date(year,
                    month || 0,
                    date || 1,
                    minutes || 0,
                    seconds || 0,
                    milliseconds || 0);
            } else if(typeof year === 'object') {
                this.date = new Date(year.getTime());
            } else {
                this.date = new Date(Date.now());
            }
        },
        
        /**
         * Clone DateTime object
         * @returns {module:core/date~DateTime}
         */
        clone: function() {
            return new DateTime(this.date);
        },

        /**
         * Compare to other DateTime object.
         * @param {module:core/date~DateTime} other
         * @returns {boolean} true if equal, false otherwise
         */
        equals: function(other) {
            if(!other) {
                return false;
            }
            return other.getTime() === this.getTime();
        },

        /**
         * Add interval to DateTime object.
         * @param {module:core/date~Interval} Interval
         */
        add: function(interval) {
            Date.Date.prototype.add.call(this, interval);

            if(interval.hours) {
                this.setHours(this.date.getHours() + interval.hours);
            }

            if(interval.minutes) {
                this.setMinutes(this.date.getMinutes() + interval.minutes);
            }

            if(interval.seconds) {
                this.setSeconds(this.date.getSeconds() + interval.seconds);
            }

            return this;
        }
    });

    var DateRange = base.Base.extend(
    /** @lends module:core/date~DateRange.prototype */{

        /**
         * DateRange constructor
         * @constructs
         * @augments module:core/base~Base
         * @param {module:core/date~Date} start Start date
         * @param {module:core/date~Date} end End date
         * @classdesc
         * Date range class with iterator.
         */
        initialize: function(start, end) {
            this.start = start;
            this.end = end;
        },

        
        /**
         * @returns {core/iterator~Iterator} Date range iterator.
         */
        iterator: function() {
            return new DateRange.Iterator(this);
        },


        /**
         * Compare to other DateRange object.
         * @param {module:core/date~DateRange} other DateRange object
         * @returns {boolean} true if equal, false otherwise
         */
        equals: function(other) {
            if(!other) {
                return false;
            }

            if(this.start && this.end) {
                return this.start.equals(other.start) &&
                       this.end.equals(other.end);
            }
            if(this.start && !this.end) {
                return !other.end && this.start.equals(other.start);
            }
            if(this.end && !this.start) {
                return !other.start && this.end.equals(other.end);
            }
        }
    }, /** @lends module:core/date~DateRange */{

        /** Minimum Date object (Jan 1, 1900) */
        MIN_DATE: new DateDate(0, 0, 1),

        /** Maximum Date object (Dec 31, 9999) */
        MAX_DATE: new DateDate(9999, 11, 31),

        Iterator: iter.Iterator.extend(
        /** @lends module:core/date~DateRange.Iterator.prototype */{

            /**
             * Iterator constructor
             * @constructs
             * @augments module:core/iterator~Iterator
             * @param {module:core/date~DateRange} dateRange DateRange object
             *  to iterator over.
             */
            initialize: function(dateRange) {
                this.nextDate = dateRange.start.clone();
                this.endDate = dateRange.end.clone();
            },
            
            /**
             * Get next Date in iterator.
             * @returns {module:core/date~Date} Date object
             */
            next: function() {
                if(this.nextDate.date > this.endDate.date) {
                    throw iter.StopIteration;
                }
                var result = new DateDate(this.nextDate);
                this.nextDate.add(new Interval(0, 0, 1));
                return result;
            }
        }),
        
        /**
         * Get Date object offset days from date.
         * @param {module:core/date~Date} date Date object
         * @param {number} offset Offset in days
         * @returns {module:core/date~Date} object which
         *  is offset days from date.
         */
        offsetInDays: function(date, offset) {
            var result = date.clone();
            result.add(new Interval(0, 0, offset));
            return result;
        },

        /**
         * Get Date object offset months from date (with day of month set to 1).
         * @param {module:core/date~Date} date Date object
         * @param {number} offset Offset in months
         * @returns {module:core/date~Date} object which
         *  is offset months from date (with day of month set to 1).
         */
        offsetInMonths: function(date, offset) {
            var result = date.clone();
            result.setDate(1);
            result.add(new Interval(0, offset));
            return result;
        },

        /**
         * Get today DateRange iterator
         * @param {module:core/date~Date} [today] Date object to
         *  use as today for calculations.
         * @returns {module:core/date~DateRange.Iterator} DateRange iterator
         */
        today: function(today) {
            today = today || new DateDate();
            return new DateRange(today.clone(), today.clone());
        },

        /**
         * Get yesterday DateRange iterator
         * @param {module:core/date~Date} [today] Date object to
         *  use as today for calculations.
         * @returns {module:core/date~DateRange.Iterator} DateRange iterator
         */
        yesterday: function(today) {
            today = today || new DateDate();
            var yesterday = this.offsetInDays(today, -1);
            return new DateRange(yesterday, yesterday.clone());
        },

        /**
         * Get this week DateRange iterator which is Sunday - 
         * Saturday of the current week.
         * @param {module:core/date~Date} [today] Date object to
         *  use as today for calculations.
         * @returns {module:core/date~DateRange.Iterator} DateRange iterator
         */
        thisWeek: function(today) {
            today = today || new DateDate();
            var start = DateRange.offsetInDays(today, -today.getDay());
            var end = DateRange.offsetInDays(today, 6 - today.getDay());
            return new DateRange(start, end);
        },

        /**
         * Get this month DateRange iterator
         * @param {module:core/date~Date} [today] Date object to
         *  use as today for calculations.
         * @returns {module:core/date~DateRange.Iterator} DateRange iterator
         */
        thisMonth: function(today) {
            today = today || new DateDate();
            var start = DateRange.offsetInMonths(today, 0);
            var end = DateRange.offsetInDays(
                    DateRange.offsetInMonths(today, 1),
                    -1);
            return new DateRange(start, end);
        },

        /**
         * Get calendar month DateRange iterator.
         * Iterator consists of the all weeks (Sunday - Saturday)
         * which contain a day in the current calendar month.
         * This iterator typically contains days from the
         * previous and next month. 
         * <br>
         * The primary use for this iterator is calendar widgets.
         * @param {module:core/date~Date} [today] Date object to
         *  use as today for calculations.
         * @returns {module:core/date~DateRange.Iterator} DateRange iterator
         */
        calendarMonth: function(today) {
            var month = DateRange.thisMonth(today);
            var start = DateRange.offsetInDays(month.start, -month.start.getDay());
            var end = DateRange.offsetInDays(month.end, 6 - month.end.getDay());
            return new DateRange(start, end);
        },

        /**
         * Get all time DateRange iterator (Jan 1, 1900 - 12/31/9999)
         * @param {module:core/date~Date} [today] Date object to
         *  use as today for calculations.
         * @returns {module:core/date~DateRange.Iterator} DateRange iterator
         */
        allTime: function() {
            return new DateRange(
                    DateRange.MIN_DATE.clone(),
                    DateRange.MAX_DATE.clone());
        }
    });

    return {
        Date: DateDate,
        DateTime: DateTime,
        DateRange: DateRange,
        Interval: Interval
    };
});
