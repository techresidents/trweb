define(/** @exports core/format */[
    'underscore',
    'globalize',
    'core/date'
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

    return {
        date: date,
        format: format,
        num: num
    };
});
