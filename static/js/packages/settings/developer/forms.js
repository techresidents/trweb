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

    /**
     * Account Form View
     * @constructor
     * @param {Object} options
     */
    var AccountFormView = ui.form.views.FormView.extend({

        initialize: function(options) {

            /*
            Hiding the legend. Leaving code snippet as reference for future.
            options = _.extend({
                legend: '<strong>Account </strong>' +
                        '<small class="muted">' +
                        'update your basic account info</small>'
            }, options);
            */

            options.fields = [
                this.firstNameField(options.model),
                this.lastNameField(options.model),
                this.emailField(options.model),
                this.locationField(options.model)
            ];

            options.actions = [
                new ui.form.actions.ButtonAction({
                    label: 'Save',
                    primary: true,
                    handler: _.bind(this.onSave, this)
                })
            ];

            AccountFormView.__super__.initialize.call(this, options);
        },

        firstNameField: function(model) {
            return new ui.form.fields.InputField({
                name: 'first_name',
                model: model,
                label: 'First Name'
            });
        },

        lastNameField: function(model) {
            return new ui.form.fields.InputField({
                name: 'last_name',
                model: model,
                label: 'Last Name'
            });
        },

        emailField: function(model) {
            return new ui.form.fields.InputField({
                name: 'email',
                model: model,
                label: 'Email',
                enabled: false
            });
        },

        locationField: function(model) {
            return new ui.form.fields.InputField({
                name: 'developer_profile__location',
                model: model,
                label: 'Location',
                placeholder: 'Boston, MA'
            });
        },

        onSave: function(options) {
            this.triggerEvent(events.UPDATE_DEVELOPER_ACCOUNT, {
                model: this.model,
                onSuccess: options.success,
                onError: options.error
            });
        }
    });

    return {
        AccountFormView: AccountFormView
    };
});
