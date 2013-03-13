define([
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

    var Interval = base.Base.extend({ 
        initialize: function(years, months, days, hours, minutes, seconds) {
            this.years = years || 0;
            this.months = months || 0;
            this.days = days || 0;
            this.hours = hours || 0;
            this.minutes = minutes || 0;
            this.seconds = seconds || 0;
        },

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

        add: function(interval) {
            this.years += interval.years;
            this.months += interval.months;
            this.days += interval.days;
            this.hours += interval.hours;
            this.minutes += interval.minutes;
            this.seconds += interval.seconds;
        }
    });

    var DateDate = base.Base.extend({
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

        clone: function() {
            return new DateDate(this.date);
        },

        equals: function(other) {
            if(!other) {
                return false;
            }
            return other.getFullYear() === this.getFullYear() &&
                   other.getMonth() === this.getMonth() &&
                   other.getDate() === this.getDate();
        },

        format: function(fmt) {
            return Globalize.format(this.date, fmt);
        },

        parseFormat: function(formats) {
            return Globalize.parseDate(this.date, this.formats);
        },

        getFullYear: function() {
            return this.date.getFullYear();
        },

        getYear: function() {
            return this.date.getYear();
        },

        getMonth: function() {
            return this.date.getMonth();
        },

        getDate: function() {
            return this.date.getDate();
        },

        getHours: function() {
            return this.date.getHours();
        },

        getMinutes: function() {
            return this.date.getMinutes();
        },

        getSeconds: function() {
            return this.date.getSeconds();
        },

        getMilliseconds: function() {
            return this.date.getMilliseconds();
        },

        getTime: function() {
            return this.date.getTime();
        },

        getDay: function() {
            return this.date.getDay();
        },

        getUTCFullYear: function() {
            return this.date.getUTCFullYear();
        },

        getUTCYear: function() {
            return this.date.getUTCYear();
        },

        getUTCMonth: function() {
            return this.date.getUTCMonth();
        },

        getUTCDate: function() {
            return this.date.getUTCDate();
        },

        getUTCHours: function() {
            return this.date.getUTCHours();
        },

        getUTCMinutes: function() {
            return this.date.getUTCMinutes();
        },

        getUTCSeconds: function() {
            return this.date.getUTCSeconds();
        },

        getUTCMilliseconds: function() {
            return this.date.getUTCMilliseconds();
        },

        getUTCDay: function() {
            return this.date.getUTCDay();
        },

        setFullYear: function(value) {
            this.date.setFullYear(value);
        },

        setMonth: function(value) {
            this.date.setMonth(value);
        },

        setDate: function(value) {
            this.date.setDate(value);
        },

        setHours: function(value) {
            this.date.setHours(value);
        },

        setMinutes: function(value) {
            this.date.setMinutes(value);
        },

        setSeconds: function(value) {
            this.date.setSeconds(value);
        },

        setMilliseconds: function(value) {
            this.date.setMillieconds(value);
        },

        setUTCFullYear: function(value) {
            this.date.setUTCFullYear(value);
        },

        setUTCMonth: function(value) {
            this.date.setUTCMonth(value);
        },

        setUTCDate: function(value) {
            this.date.setUTCDate(value);
        },

        setUTCHours: function(value) {
            this.date.setUTCHours(value);
        },

        setUTCMinutes: function(value) {
            this.date.setUTCMinutes(value);
        },

        setUTCSeconds: function(value) {
            this.date.setUTCSeconds(value);
        },

        setUTCMilliseconds: function(value) {
            this.date.setUTCMilliseconds(value);
        },

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

        toDateString: function() {
            return this.date.toDateString();
        },

        toGMTString: function() {
            return this.date.toGMTString();
        },

        toISOString: function() {
            return this.date.toISOString();
        },

        toJSON: function() {
            return this.date.toJSON();
        },

        toLocaleDateString: function() {
            return this.date.toLocaleString();
        },

        toLocaleTimeString: function() {
            return this.date.toLocaleTimeString();
        },

        toString: function() {
            return this.date.toString();
        },

        toTimeString: function() {
            return this.date.toTimeString();
        },

        toUTCString: function() {
            return this.date.toUTCString();
        },

        UTC: function() {
            return this.date.UTC();
        },

        valueOf: function() {
            return this.date.valueOf();
        }
    }, {
        fromTimestamp: function(timestamp) {
            var date = new Date(0);
            date.setUTCSeconds(timestamp);
            return new DateDate(date);
        }
    });

    var DateTime = DateDate.extend({
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

        clone: function() {
            return new DateTime(this.date);
        },

        equals: function(other) {
            if(!other) {
                return false;
            }
            return other.getTime() === this.getTime();
        },

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

    /**
     * Date Range class.
     * @constructor
     */
    var DateRange = base.Base.extend({
        initialize: function(start, end) {
            this.start = start;
            this.end = end;
        },

        
        iterator: function() {
            return new DateRange.Iterator(this);
        },

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
    }, {
        MIN_DATE: new DateDate(0, 0, 1),

        MAX_DATE: new DateDate(9999, 11, 31),

        Iterator: iter.Iterator.extend({
            initialize: function(dateRange) {
                this.nextDate = dateRange.start.clone();
                this.endDate = dateRange.end.clone();
            },
            
            next: function() {
                if(this.nextDate.date > this.endDate.date) {
                    throw iter.StopIteration;
                }
                var result = new DateDate(this.nextDate);
                this.nextDate.add(new Interval(0, 0, 1));
                return result;
            }
        }),
        
        offsetInDays: function(date, offset) {
            var result = date.clone();
            result.add(new Interval(0, 0, offset));
            return result;
        },

        offsetInMonths: function(date, offset) {
            var result = date.clone();
            result.setDate(1);
            result.add(new Interval(0, offset));
            return result;
        },

        today: function(today) {
            today = today || new DateDate();
            return new DateRange(today.clone(), today.clone());
        },

        yesterday: function(today) {
            today = today || new DateDate();
            var yesterday = this.offsetInDays(today, -1);
            return new DateRange(yesterday, yesterday.clone());
        },

        thisWeek: function(today) {
            today = today || new DateDate();
            var start = DateRange.offsetInDays(today, -today.getDay());
            var end = DateRange.offsetInDays(today, 6 - today.getDay());
            return new DateRange(start, end);
        },

        thisMonth: function(today) {
            today = today || new DateDate();
            var start = DateRange.offsetInMonths(today, 0);
            var end = DateRange.offsetInDays(
                    DateRange.offsetInMonths(today, 1),
                    -1);
            return new DateRange(start, end);
        },

        calendarMonth: function(today) {
            var month = DateRange.thisMonth(today);
            var start = DateRange.offsetInDays(month.start, -month.start.getDay());
            var end = DateRange.offsetInDays(month.end, 6 - month.end.getDay());
            return new DateRange(start, end);
        },

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
