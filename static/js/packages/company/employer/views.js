define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    'text!./templates/company.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    employer_company_template) {

    /**
     * EmployerCompanyView View
     * @constructor
     * @param {Object} options
     */
    var EmployerCompanyView = core.view.View.extend({

        events: {
        },

        initialize: function(options) {
            this.template =  _.template(employer_company_template);
        },

        render: function() {
            this.$el.html(this.template());
            return this;
        }
    });

    return {
        EmployerCompanyView: EmployerCompanyView
    };
});
