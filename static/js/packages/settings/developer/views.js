define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    'text!./templates/developer_settings.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    developer_settings_template) {

    /**
     * DeveloperSettingsView View
     * @constructor
     * @param {Object} options
     */
    var DeveloperSettingsView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template =  _.template(developer_settings_template);

        },

        render: function() {
            this.$el.html(this.template());
            return this;
        }
    });

    return {
        DeveloperSettingsView: DeveloperSettingsView
    };
});
