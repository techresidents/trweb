define(/** @exports ui/form/comparators */[
    'jquery',
    'underscore',
    'backbone',
    'core'
], function(
    $,
    _,
    Backbone,
    core) {

    var Comparator = core.base.Base.extend(
    /** @lends module:ui/form/comparators~Comparator.prototype */ {

        /**
         * Comparator constructor
         * @constructor
         * @augments module:core/base~Base
         * @param {object} options Options object
         */
        initialize: function(options) {
        },

        /**
         * Compare a to b
         * @returns 1 if a > b,
         *          0 if a === b,
         *          -1 if a < b 
         *          undefined if ambiguous
         */
        compare: function(a, b) {
            var result;

            if(a === undefined && b === undefined) {
                result = 0;
            } else if(a === null && b === null) {
                result = 0;
            } else if (a === null || a === undefined ||
                       b === null || b === undefined) {
                result = undefined;
            } else if(_.isString(a) && _.isString(b)) {
                result = this._compareString(a, b);
            } else if(_.isNumber(a) && _.isNumber(b)) {
                result = this._compareNumber(a, b);
            } else if(_.isBoolean(a) && _.isBoolean(b)) {
                result = this._compareBoolean(a, b);
            } else if((_.isDate(a) || a instanceof core.date.Date) &&
                      (_.isDate(b) || b instanceof core.date.Date)) {
                result = this._compareDate(a, b);
            } else if(a instanceof Backbone.Collection &&
                      b instanceof Backbone.Collection) {
                result = this._compareCollection(a, b);
            } else if(_.isObject(a) && _.isObject(b)) {
                result = this._compareObject(a, b);
            } else {
                result = undefined;
            }

            return result;
        },
        
        _compareString: function(a, b) {
            return a > b ? 1 : a < b ? -1: 0;
        },

        _compareNumber: function(a, b) {
            return a > b ? 1 : a < b ? -1: 0;
        },

        _compareBoolean: function(a, b) {
            return a === b ? 0 : undefined;
        },

        _compareDate: function(a, b) {
            a = a.getTime();
            b = b.getTime();
            return this._compareNumber(a, b);
        },

        _compareModel: function(a, b) {
            return this._compareObject(a, b);
        },

        _compareCollection: function(a, b) {
            var result;
            if(a.length === b.length) {
                result = 0;
                a.each(function(model) {
                    var other = b.get(model.id);
                    if(!other) {
                        result = undefined;

                    } else if(_.isFunction(model.isDirty) &&
                              model.isDirty() !== other.isDirty()) {
                        result = undefined;
                    }
                });
            }
            return result;
        },

        _compareObject: function(a, b) {
            return a === b ? 0 : undefined;
        }

    });

    return {
        Comparator: Comparator
    };

});
