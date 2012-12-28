define([
    'jquery',
    'underscore',
    'backbone',
    'backbone.localStorage'
], function($, _, Backbone, none) {

    var SEVERITY = {
        DEBUG: 'debug',
        INFO: 'info',
        WARNING: 'warning',
        ERROR: 'error',
        SUCCESS: 'success'
    };

    var STYLE = {
        BLOCK: 'alert-block', // for longer messages
        NORMAL: '' // for short messages
    };
    
    /**
     * Alert View Model.
     * @constructor
     */
    var AlertValueObject = Backbone.Model.extend({

        localStorage: new Backbone.LocalStorage("AlertValueObject"),

        defaults: function() {
            return {
                severity: SEVERITY.INFO,
                style: STYLE.BLOCK,
                message: null
            };
        },

        severity: function() {
            return this.get('severity');
        },

        setSeverity: function(severity) {
            this.set({ severity: severity });
            return this;
        },

        message: function() {
            return this.get('message');
        },

        setMessage: function(message) {
            this.set({ message: message });
            return this;
        }
    });


    return {
        SEVERITY: SEVERITY,
        STYLE: STYLE,
        AlertValueObject: AlertValueObject
    };
});
