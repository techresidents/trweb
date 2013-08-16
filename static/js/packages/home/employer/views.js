define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    'text!./templates/employer_home.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    employer_home_template) {

    /**
     * EmployerHomeView View
     * @constructor
     * @param {Object} options
     */
    var EmployerHomeView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template =  _.template(employer_home_template);
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        }
    });

    return {
        EmployerHomeView: EmployerHomeView
    };
});
