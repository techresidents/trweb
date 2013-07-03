define(/** @exports ui/form/formatters */[
    'jquery',
    'underscore',
    'core',
    'globalize'
], function(
    $,
    _,
    core,
    Globalize) {

    var Formatter = core.base.Base.extend(
    /** @lends module:ui/form/formatters~Formatter.prototype */ {

        /**
         * Formatter constructor
         * @constructor
         * @augments module:core/base~Base
         * @param {object} options Options object
         */
        initialize: function(options) {
        },
        

        /**
         * Format field value for display.
         * @param {object} value Validated field value which
         *   may be of varying types.
         * @returns {object} Formatted field value which
         *   may be of varying types, but is typically
         *   a string.
         */
        format: function(value) {
            return value;
        }
    });

    var IntegerFormatter = Formatter.extend(
    /** @lends module:ui/form/formatters~IntegerFormatter.prototype */ {

        /**
         * Integer Formatter constructor
         * @constructor
         * @augments module:ui/form/formatters~Formatter
         * @param {object} options Options object
         */
        initialize: function(options) {
        },
        
        /**
         * Format field value for display.
         * @param {number} value Validated field value.
         * @returns {string} Formatted field value.
         */
        format: function(value) {
            if(value !== null && value !== undefined) {
                value = Globalize.format(value, 'n0');
            }
            return value;
        }
    });

    var FloatFormatter = Formatter.extend(
    /** @lends module:ui/form/formatters~FloatFormatter.prototype */ {

        /**
         * Float Formatter constructor
         * @constructor
         * @augments module:ui/form/formatters~Formatter
         * @param {object} options Options object
         */
        initialize: function(options) {
        }
    });

    var DateFormatter = Formatter.extend(
    /** @lends module:ui/form/formatters~DateFormatter.prototype */ {

        /**
         * Date Formatter constructor
         * @constructor
         * @augments module:ui/form/formatters~Formatter
         * @param {object} options Options object
         * @param {string} [options.format] Date format string
         *   i.e. 'MM/dd/yyyy'
         */
        initialize: function(options) {
            options = _.extend({
                format: 'MM/dd/yyyy'
            }, options);

            this._format = options.format;
        },

        /**
         * Format field value for display.
         * @param {Date} value Validated field value.
         * @returns {string} Formatted field value.
         */
        format: function(value) {
            if(value !== null && value !== undefined) {
                value = Globalize.format(value.date, this._format);
            }
            return value;
        }
    });

    return {
        Formatter: Formatter,
        IntegerFormatter: IntegerFormatter,
        FloatFormatter: FloatFormatter,
        DateFormatter: DateFormatter
    };

});
