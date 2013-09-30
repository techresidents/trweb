define([
    'jquery',
    'underscore',
    'backbone',
    'core',
    'api',
    'ui',
    'events'
], function(
    $,
    _,
    Backbone,
    core,
    api,
    ui,
    events) {

    var CompanyProfileFormView = ui.form.views.FormView.extend({

        /**
         * Company Profile Form View
         * @constructor
         * @param {Object} options
         * @param {CompanyProfile} options.model CompanyProfile model
         */
        initialize: function(options) {
            this.model = options.model;

            options.fields = [
                this.nameField(this.model),
                this.sizeField(this.model),
                this.locationField(this.model),
                this.urlField(this.model),
                this.descriptionField(this.model)
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
                    { label: '1-10', value: '1-10' },
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

        urlField: function(model) {
            return new ui.form.fields.InputField({
                name: 'url',
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

            this.triggerEvent(events.UPDATE_COMPANY_PROFILE, {
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
