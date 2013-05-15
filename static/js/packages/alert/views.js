define([
    'jquery',
    'underscore',
    'core',
    './models',
    'text!./templates/alert.html'
], function(
    $,
    _,
    core,
    alert_models,
    alert_template) {


    var EVENTS = {
    };


    /**
     * Alerts view.
     * @constructor
     * @param {Object} options
     *    model: AlertValueObject (required)
     */
    var AlertView = core.view.View.extend({

        events: {
            'click .destroy': 'onDestroy'
        },

        initialize: function() {
            this.template = _.template(alert_template);
        },

        isAlert: function() {
            return true;
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        onDestroy: function() {
            this.destroy();
        }
    });
    
    return {
        AlertView: AlertView
    };
});
