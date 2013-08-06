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
                this.timezoneField(options.model),
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

        timezoneField: function(model) {
            return new ui.form.fields.DropdownField({
                name: 'timezone',
                model: model,
                label: 'Time zone',
                choices: [
                    { label: '(GMT-10:00) Hawaii Time', value: 'US/Hawaii' },
                    { label: '(GMT-09:00) Alaska Time', value: 'US/Alaska' },
                    { label: '(GMT-08:00) Pacific Time', value: 'US/Pacific' },
                    { label: '(GMT-07:00) Mountain Time', value: 'US/Mountain' },
                    { label: '(GMT-07:00) Mountain Time - Arizona', value: 'US/Arizona' },
                    { label: '(GMT-06:00) Central Time', value: 'US/Central' },
                    { label: '(GMT-05:00) Eastern Time', value: 'US/Eastern' }
                ]
            });
        },

        locationField: function(model) {
            //build query factory
            var queryFactory = function(options) {
                var collection = new api.models.LocationSearchCollection();
                var query = collection.filterBy({
                    ac: options.search
                }).slice(0, options.maxResults);
                return query;
            };
            queryFactory = new core.factory.FunctionFactory(queryFactory);

            //matcher map function to convert location search
            //model to a string
            var map = function(locationSearchModel) {
                return locationSearchModel.get_region();
            };

            //convert string or model to string
            var stringify = function(stringOrModel) {
                var result = stringOrModel;
                if(stringOrModel instanceof api.models.LocationSearch) {
                    result = stringOrModel.get_region();
                }
                return result;
            };

            //match which will return location string to ac view
            var matcher = new ui.ac.matcher.QueryMatcher({
                queryFactory: queryFactory,
                map: map,
                stringify: stringify
            });


            return new ui.form.fields.AutoCompleteField({
                name: 'developer_profile__location',
                model: model,
                label: 'Location',
                matcher: matcher,
                placeholder: 'Boston, New York',
                maxResults: 20,
                required: false,
                viewOptions: { defaultSearch: '' }
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
