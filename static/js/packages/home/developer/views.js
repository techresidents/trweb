define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    'text!./templates/developer_home.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    developer_home_template) {

    /**
     * DeveloperHomeView View
     * @constructor
     * @param {Object} options
     */
    var DeveloperHomeView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template =  _.template(developer_home_template);

        },

        render: function() {
            this.$el.html(this.template());
            return this;
        }
    });

    return {
        DeveloperHomeView: DeveloperHomeView
    };
});
