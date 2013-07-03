define(/** @exports ui/form/validators */[
    'jquery',
    'underscore',
    'core',
    'globalize'
], function(
    $,
    _,
    core,
    Globalize) {

    var FormValidator = core.base.Base.extend(
    /** @lends module:ui/form/validators~FormValidator.prototype */ {

        /**
         * FormValidator constructor
         * @constructor
         * @augments module:core/base~Base
         * @param {object} options Options object
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         */
        initialize: function(options) {
        },

        /**
         * Validate the form
         * @param {FormState} state Current form state
         * @returns {boolean} True if form is valid or False if
         *   form is invalid but no error message should be displayed.
         * @throws {Error} If form is invalid
         *   an exception will be raised containing
         *   an appropriate error message.
         */
        validate: function(state) {
            var result = true;
            state.fields().each(function(fieldModel) {
                var field = fieldModel.field();
                if(!field.state.valid()) {
                    result = false;
                }
            }, this);

            return result;
        }
        
    });

    var FieldValidator = core.base.Base.extend(
    /** @lends module:ui/form/validators~FieldValidator.prototype */ {

        /**
         * FieldValidator constructor
         * @constructor
         * @augments module:core/base~Base
         * @param {object} options Options object
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         */
        initialize: function(options) {
            options = _.extend({
                required: true
            }, options);

            this.required = options.required;
            this.requiredMessage = options.requiredMessage;
        },

        /**
         * Convert value to appropriate field type.
         * @param {object} value Value to parse which
         *   may be of varying types.
         * @returns {object} Parsed field value
         *   may be of varying types.
         * @throws {Error} If value cannot be parsed
         *   an exception will be raised containing
         *   an appropriate error message.
         */
        parse: function(value) {
            return value;
        },
        
        /**
         * Return the validated field value.
         * @param {object} value Value to validate which
         *   may be of varying types.
         * @returns {object} Validated field value which
         *   may be of varying types.
         * @throws {Error} If value is invalid
         *   an exception will be raised containing
         *   an appropriate error message.
         */
        validate: function(value) {
            var result = this.parse(value);
            if(this.required &&
               (_.isNull(result) || _.isUndefined(result))) {
                throw new Error('required');
            }
            return result;
        }
        
    });

    var StringValidator = FieldValidator.extend(
    /** @lends module:ui/form/validators~StringValidator.prototype */ {

        /**
         * String Validator constructor
         * @constructor
         * @augments module:ui/form/validators~FieldValidator
         * @param {object} options Options object
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         */
        initialize: function(options) {
            StringValidator.__super__.initialize.call(this, options);
        },
        
        /**
         * Convert value to string.
         * @param {string} value Value to parse.
         * @returns {string} Parsed string value
         * @throws {Error} If value cannot be parsed
         *   an exception will be raised containing
         *   an appropriate error message.
         */
        parse: function(value) {
            var result = value;

            //convert empty string to null for validation purposes
            if(value === '') {
                result = null;
            }
            return result;
        }
    });

    var IntegerValidator = FieldValidator.extend(
    /** @lends module:ui/form/validators~IntegerValidator.prototype */ {

        /**
         * Integer Validator constructor
         * @constructor
         * @augments module:ui/form/validators~FieldValidator
         * @param {object} options Options object
         * @param {boolean} [options.required=true] Boolean indicating
         *   that the field is required.
         * @param {number} [options.min] Minimum value
         * @param {number} [options.max] Maximum value
         * @param {regex} [options.regex] Integer regex
         */
        initialize: function(options) {
            options = _.extend({
                min: null,
                max: null,
                regex:  /^-?[\d,]+$/
            }, options);

            this.min = options.min;
            this.max = options.max;
            this.regex = options.regex;

            IntegerValidator.__super__.initialize.call(this, options);
        },
        
        /**
         * Convert value to integer.
         * @param {string|number} value Value to parse.
         * @returns {number} Parsed integer value
         * @throws {Error} If value cannot be parsed
         *   an exception will be raised containing
         *   an appropriate error message.
         */
        parse: function(value) {
            var result;
            if(_.isNull(value) || _.isUndefined(value)) {
                result = null;
            }
            else if(_.isNumber(value)) {
                if(value % 1 !== 0) {
                    throw new Error('invalid integer');
                }
                result = value;
            } else if(_.isString(value)) {
                if(value === '') {
                    result = null;
                }
                else if(!value.match(this.regex)) {
                    throw new Error('invalid integer');
                } else {
                    result = Globalize.parseInt(value, 10);
                    if(_.isNaN(result)) {
                        throw new Error('invalid integer');
                    }
                }
            } else {
                throw new Error('invalid integer');
            }
            return result;
        },

        /**
         * Return the validated field value.
         * @param {string|number} value Value to validate.
         * @returns {number} Validated field value. 
         * @throws {Error} If value is invalid
         *   an exception will be raised containing
         *   an appropriate error message.
         */
        validate: function(value) {
            var result = IntegerValidator.__super__.validate.call(this, value);
            if(_.isNumber(this.min) && result < this.min) {
                throw new Error('less than ' + this.min);
            } else if(_.isNumber(this.max) && result > this.max) {
                throw new Error('greater than ' + this.max);
            }
            return result;
        }
    });

    var FloatValidator = FieldValidator.extend(
    /** @lends module:ui/form/validators~FloatValidator.prototype */ {

        /**
         * Float Validator constructor
         * @constructor
         * @augments module:ui/form/validators~FieldValidator
         * @param {object} options Options object
         */
        initialize: function(options) {
            options = _.extend({
                min: null,
                max: null
            }, options);

            this.min = options.min;
            this.max = options.max;
            this.regex = /^[\d,]*(\.\d+)?$/;

            FloatValidator.__super__.initialize.call(this, options);
        },
        
        /**
         * Convert value to a float.
         * @param {string|number} value Value to parse.
         * @returns {number} Parsed integer value
         * @throws {Error} If value cannot be parsed
         *   an exception will be raised containing
         *   an appropriate error message.
         */
        parse: function(value) {
            var result;
            if(_.isNull(value) || _.isUndefined(value)) {
                result = null;
            }
            else if(_.isNumber(value)) {
                result = value;
            } else if(_.isString(value)) {
                if(value === '') {
                    result = null;
                }
                else if(!value.match(this.regex)) {
                    throw new Error('invalid number');
                } else {
                    result = Globalize.parseFloat(value, 10);
                    if(_.isNaN(result)) {
                        throw new Error('invalid number');
                    }
                }
            } else {
                throw new Error('invalid number');
            }
            return result;
        },

        /**
         * Return the validated field value.
         * @param {string|number} value Value to validate.
         * @returns {number} Validated field value. 
         * @throws {Error} If value is invalid
         *   an exception will be raised containing
         *   an appropriate error message.
         */
        validate: function(value) {
            var result = FloatValidator.__super__.validate.call(this, value);
            if(_.isNumber(this.min) && result < this.min) {
                throw new Error('must be >= ' + this.min);
            } else if(_.isNumber(this.max) && result > this.max) {
                throw new Error('must be <= ' + this.max);
            }
            return result;
        }
    });

    var DateValidator = FieldValidator.extend(
    /** @lends module:ui/form/validators~DateValidator.prototype */ {

        /**
         * Date Validator constructor
         * @constructor
         * @augments module:ui/form/validators~FieldValidator
         * @param {object} options Options object
         * @param {array} [options.formats] Array of date formats
         *   i.e. ['MM/dd/yyyy']
         */
        initialize: function(options) {
            options = _.extend({
                formats: ['MM/dd/yyyy']
            }, options);

            this.formats = options.formats;

            DateValidator.__super__.initialize.call(this, options);
        },

        /**
         * Convert value to a float.
         * @param {string|Date} value Value to parse.
         * @returns {Date} Parsed date value
         * @throws {Error} If value cannot be parsed
         *   an exception will be raised containing
         *   an appropriate error message.
         */
        parse: function(value) {
            var result;
            if(_.isNull(value) || _.isUndefined(value)) {
                result = null;
            }
            else if(_.isString(value)) {
                result = Globalize.parseDate(value, this.formats);
                if(result === null || result === undefined) {
                    throw new Error('invalid date');
                }
            } else if(_.isDate(value)) {
                result = new core.date.Date(value);
            } else if(value instanceof core.date.DateTime) {
                result = new core.date.Date(value.date);
            } else if(value instanceof core.date.Date) {
                result = value;
            } else {
                throw new Error('invalid date');
            }
            return result;
        },

        /**
         * Return the validated field value.
         * @param {string|Date} value Value to validate.
         * @returns {Date} Validated field value. 
         * @throws {Error} If value is invalid
         *   an exception will be raised containing
         *   an appropriate error message.
         */
        validate: function(value) {
            var result = DateValidator.__super__.validate.call(this, value);
            return result;
        }
    });

    return {
        FormValidator: FormValidator,
        FieldValidator: FieldValidator,
        StringValidator: StringValidator,
        IntegerValidator: IntegerValidator,
        FloatValidator: FloatValidator,
        DateValidator: DateValidator
    };

});
