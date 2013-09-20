define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'events',
    'ui',
    './forms',
    'text!./templates/company_profile.html',
    'text!./templates/company_profile_edit.html'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    events,
    ui,
    employer_company_profile_forms,
    employer_company_profile_template,
    employer_company_profile_edit_template) {

    var CompanyProfileView = core.view.View.extend({

        /**
         * Employer Company Profile View
         * @constructor
         * @param {Object} options
         * @param {CompanyProfile} options.model CompanyProfile model
         * @classdesc
         * View to display employer company profile
         */
        initialize: function(options) {
            this.model = options.model;
            this.template =  _.template(employer_company_profile_template);
            this.loader = new api.loader.ApiLoader([
                { instance: this.model }
            ]);

            // bindings
            this.listenTo(this.loader, 'loaded', this.render);

            // load data
            this.loader.load();
        },

        classes: function() {
            return ['employer-company-profile'];
        },

        render: function() {
            if (this.loader.isLoaded()) {
                var context = {
                    model: this.model.toJSON()
                };
                this.$el.html(this.template(context));
                this.$el.attr('class', this.classes().join(' '));
            }
            return this;
        }
    });

    var CompanyProfileEditView = core.view.View.extend({

        /**
         * Employer Company Profile Edit View
         * @constructor
         * @param {Object} options
         * @param {CompanyProfile} options.model CompanyProfile model
         * @classdesc
         * View to edit the employer company profile
         */
        initialize: function(options) {
            this.model = options.model;
            this.template =  _.template(employer_company_profile_edit_template);
            this.loader = new api.loader.ApiLoader([
                { instance: this.model }
            ]);

            // bindings
            this.listenTo(this.loader, 'loaded', this.render);

            // load data
            this.loader.load();

            // child views
            this.formView = null;
            this.initChildViews();
        },

        initChildViews: function() {
            this.formView = new employer_company_profile_forms.CompanyProfileFormView({
                model: this.model
            });
        },

        childViews: function() {
            return [this.formView];
        },

        classes: function() {
            return ['employer-company-profile-edit'];
        },

        render: function() {
            if (this.loader.isLoaded()) {
                this.$el.html(this.template());
                this.$el.attr('class', this.classes().join(' '));
                this.append(this.formView);
            }
            return this;
        }
    });

    return {
        CompanyProfileView: CompanyProfileView,
        CompanyProfileEditView: CompanyProfileEditView
    };
});
