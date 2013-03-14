define([
    'underscore',
    'globalize',
    'core/date'
], function(_, Globalize, core_date) {

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
