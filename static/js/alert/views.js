define([
    'jQuery',
    'Underscore',
    'core/view',
    'alert/models',
    'text!alert/templates/alert.html'
], function(
    $,
    _,
    view,
    alert_models,
    alert_template) {


    var EVENTS = {
    };


    /**
     * Alerts view.
     * @constructor
     * @param {Object} options
     */
    var AlertView = view.View.extend({

        events: {
            'click .destroy': 'onDestroy'
        },

        initialize: function() {
            this.template = _.template(alert_template);
        },

        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
            return this;
        },

        onDestroy: function() {
            this.$el.remove();
        }
    });
    
    return {
        AlertView: AlertView
    };
});
