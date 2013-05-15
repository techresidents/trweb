define(/** @exports core/format */[
    'underscore',
    'globalize',
    './date'
], function(_, Globalize, core_date) {

    /**
     * Format date with Globalize.
     * <br>
     * See {@link https://github.com/jquery/globalize#dates} for formats.
     * @param {Date|DateTime|timestamp} value Value to format
     * @param {string} format Globalize format string.
     * @returns {string} Formatted date string.
     */
    var date = function(value, format) {
        var result;
        if(_.isDate(value)) {
            result = Globalize.format(value, format);
        } else if(value instanceof core_date.Date) {
            result = Globalize.format(value.date, format);
        } else if(value instanceof core_date.DateTime) {
            result = Globalize.format(value.date, format);
        }
        else if(_.isNumber(value)) {
            result = Globalize.format(new Date(value*1000), format);
        }
        return result;
    };

    /**
     * Format value with Globalize.
     * <br>
     * See {@link https://github.com/jquery/globalize#format} for formats.
     * @param {number} value Value to format
     * @param {string} format Globalize format string.
     * @returns {string} Formatted string.
     */
    var format = function(value, format) {
        return Globalize.format(value, format);
    };

    var num = format;

    /**
     * Format text to display multiple lines when rendered.
     * This function replaces '\n' with <br> to do this.
     * @param value text string
     * @returns {string} formatted string
     */
    var multiline = function(value) {
        var result = value;
        if (_.isString(value) && value.length) {
            result = value.replace(/\n/g, '<br/>');
        }
        return result;
    };
    
    /**
     * Helper method for formatting timers.
     * This method converts a number to a 2-digit string.
     * @param value number to convert
     * @returns {string} formatted string
     */
    var pad2 = function(value) {
        var result;
        if(value < 10) {
            result = '0' + value;
        } else {
            result = value.toString();
        }
        return result;
    };

    /**
     * Format timer string.
     * @param durationMs time remaing on timer in ms
     * @returns {string} formatted string
     */
    var timer = function(durationMs) {
        var result;
        var negative = durationMs < 0;

        if(negative) {
            durationMs *= -1;
        }

        var hours = Math.floor(durationMs / 1000 / 60 / 60);
        durationMs -= (hours * 1000 * 60 * 60);
        var minutes = Math.floor(durationMs / 1000 / 60);
        durationMs -= (minutes * 1000 * 60);
        var seconds = Math.floor(durationMs / 1000);
        
        if(hours) {
            result = pad2(hours) + ':' + pad2(minutes) + ':' + pad2(seconds);
        } else {
            result = pad2(minutes) + ':' + pad2(seconds);
        }
        
        if(negative) {
           result = '-' + result;
        }

        return result;
    };

    return {
        date: date,
        format: format,
        num: num,
        multiline: multiline,
        timer: timer
    };
});
