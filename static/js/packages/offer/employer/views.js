define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    'text!./templates/offers.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    employer_offers_template) {

    /**
     * EmployerOffersView View
     * @constructor
     * @param {Object} options
     */
    var EmployerOffersView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template =  _.template(employer_offers_template);
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        }
    });

    return {
        EmployerOffersView: EmployerOffersView
    };
});
