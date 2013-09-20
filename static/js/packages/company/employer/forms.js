define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'ui',
    'widget',
    'events'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    ui,
    widget,
    events) {

    var CompanyProfileFormView = ui.form.views.FormView.extend({

        /**
         * Company Profile Form View
         * @constructor
         * @param {Object} options
         * @param {Tenant} options.model Tenant model
         */
        initialize: function(options) {
            this.tenantModel = options.model;
            this.companyProfileModel = options.model.get_company_profile();

            options.fields = [
                this.nameField(this.tenantModel),
                this.sizeField(this.companyProfileModel),
                this.locationField(this.companyProfileModel),
                this.websiteField(this.companyProfileModel),
                this.descriptionField(this.companyProfileModel)
            ];

            options.actions = [
                new ui.form.actions.ButtonAction({
                    label: 'Save',
                    primary: true,
                    handler: _.bind(this.onSave, this)
                })
            ];

            CompanyProfileFormView.__super__.initialize.call(this, options);
        },

        classes: function() {
            result = CompanyProfileFormView.__super__.classes.call(this);
            result.push('form-company-profile');
            return result;
        },

        nameField: function(model) {
            return new ui.form.fields.InputField({
                name: 'name',
                model: model,
                label: 'Name',
                placeholder: 'Company Name'
            });
        },

        sizeField: function(model) {
            return new ui.form.fields.DropdownField({
                name: 'size',
                model: model,
                label: 'Size',
                choices: [
                    { label: '1', value: '1' },
                    { label: '2-10', value: '2-10' },
                    { label: '11-50', value: '11-50' },
                    { label: '51-200', value: '51-200' },
                    { label: '201-500', value: '201-500' },
                    { label: '501-1000', value: '501-1000' },
                    { label: '1001-5000', value: '1001-5000' },
                    { label: '5001-10000', value: '5001-10000' },
                    { label: '10000+', value: '10000+' }
                ]
            });
        },

        locationField: function(model) {
            return new ui.form.fields.InputField({
                name: 'location',
                model: model,
                label: 'Location',
                placeholder: 'Boston, MA'
            });
        },

        websiteField: function(model) {
            return new ui.form.fields.InputField({
                name: 'website',
                model: model,
                label: 'Website',
                placeholder: 'http://company.com'
            });
        },

        descriptionField: function(model) {
            return new ui.form.fields.TextField({
                name: 'description',
                model: model,
                label: 'Description',
                placeholder: 'Company Description',
                rows: 9,
                viewOptions: {classes: 'input-xxlarge'}
            });
        },

        onSave: function(options) {
            var success = function() {
                options.success.apply(this, arguments);
                this.triggerEvent(events.VIEW_NAVIGATE, {
                    type: 'EmployerCompanyProfileView'
                });
            };

            this.triggerEvent(events.SAVE_COMPANY_PROFILE, {
                model: this.model,
                onSuccess: _.bind(success, this),
                onError: options.error
            });
        }
    });

    return {
        CompanyProfileFormView: CompanyProfileFormView
    };
});
